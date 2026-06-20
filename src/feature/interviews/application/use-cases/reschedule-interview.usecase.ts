import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationEntity } from '../../../applications/entities/application.entity';
import { ApplicationStageHistoryEntity } from '../../../applications/entities/application-stage-history.entity';
import { ApplicationCurrentStage } from '../../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../../applications/enums/application-status.enum';
import { RescheduleInterviewDto } from '../../dto/reschedule-interview.dto';
import { InterviewEntity } from '../../entities/interview.entity';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewsValidationHelper } from '../../helpers/interviews-validation.helper';
import { CandidateResumeValidationHelper } from '../../helpers/candidate-resume-validation.helper';
import { InterviewRepository } from '../../repositories/interview.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class RescheduleInterviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly validationHelper: InterviewsValidationHelper,
    private readonly resumeValidation: CandidateResumeValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    interviewId: string,
    dto: RescheduleInterviewDto,
    actorUserId: string,
  ): Promise<InterviewEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const current = await this.interviewRepository.findById(interviewId, {
        manager,
      });

      if (!current) {
        throw new NotFoundException({
          message: 'Interview not found',
          code: 'INTERVIEW_NOT_FOUND',
        });
      }

      if (current.interview_status !== InterviewStatus.SCHEDULED) {
        throw new ConflictException({
          message: 'Only scheduled interviews can be rescheduled',
          code: 'INTERVIEW_NOT_RESCHEDULABLE',
        });
      }

      const application = await manager
        .getRepository(ApplicationEntity)
        .createQueryBuilder('applications')
        .where('applications.id = :id', { id: current.application_id })
        .andWhere('applications.deleted_at IS NULL')
        .setLock('pessimistic_write')
        .getOne();

      if (!application) {
        throw new NotFoundException({
          message: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      if (application.application_status !== ApplicationStatus.ACTIVE) {
        throw new ConflictException({
          message: 'Interview can only be rescheduled for ACTIVE applications',
          code: 'APPLICATION_NOT_ACTIVE_FOR_INTERVIEW',
          meta: { application_status: application.application_status },
        });
      }

      const allowedStages = new Set<ApplicationCurrentStage>([
        ApplicationCurrentStage.SHORTLISTED,
        ApplicationCurrentStage.INTERVIEW,
      ]);

      if (!allowedStages.has(application.current_stage)) {
        throw new ConflictException({
          message:
            'Interview can only be rescheduled when application is in SHORTLISTED or INTERVIEW stage',
          code: 'APPLICATION_NOT_ELIGIBLE_FOR_INTERVIEW_STAGE',
          meta: { current_stage: application.current_stage },
        });
      }

      await this.resumeValidation.ensureLatestResumeExists({
        candidateId: application.candidate_id,
        manager,
      });

      const startAt = new Date(dto.scheduled_start_at);
      const endAt = new Date(dto.scheduled_end_at);

      this.validationHelper.ensureValidScheduleWindow({ startAt, endAt });
      this.validationHelper.ensureScheduleNotInPast({ startAt });

      const duplicate = await this.interviewRepository.findDuplicateSchedule({
        applicationId: current.application_id,
        interviewRoundId: current.interview_round_id,
        scheduledStartAt: startAt,
        scheduledEndAt: endAt,
        manager,
      });

      if (duplicate) {
        throw new ConflictException({
          message: 'Interview is already scheduled for the same time window',
          code: 'INTERVIEW_DUPLICATE_SCHEDULE',
          meta: { interview_id: duplicate.id },
        });
      }

      if (application.current_stage === ApplicationCurrentStage.SHORTLISTED) {
        const fromStage = application.current_stage;
        const toStage = ApplicationCurrentStage.INTERVIEW;
        const changeReason = 'Interview scheduled';

        await manager.getRepository(ApplicationStageHistoryEntity).save(
          manager.getRepository(ApplicationStageHistoryEntity).create({
            application_id: application.id,
            from_stage: fromStage,
            to_stage: toStage,
            changed_by_user_id: actorUserId,
            change_reason: changeReason,
            changed_at: now,
            deleted_at: null,
          }),
        );

        application.current_stage = toStage;
        application.last_stage_changed_at = now;
        application.updated_by_user_id = actorUserId;
        await manager.getRepository(ApplicationEntity).save(application);

        await this.activityWriter.log(
          ActivityLogBuilder.stageChange({
            entityType: ActivityEntityType.APPLICATION,
            entityId: application.id,
            fromStage,
            toStage,
            reason: changeReason,
            actorUserId,
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      const meetingLink =
        dto.meeting_link !== undefined
          ? dto.meeting_link?.trim() || null
          : current.meeting_link;

      const locationDetails =
        dto.location_details !== undefined
          ? dto.location_details?.trim() || null
          : current.location_details;

      this.validationHelper.ensureModeDetails({
        mode: current.interview_mode,
        meetingLink,
        locationDetails,
      });

      const oldStatus = current.interview_status;
      current.interview_status = InterviewStatus.RESCHEDULED;
      current.reschedule_reason = String(dto.reschedule_reason).trim();
      current.updated_by_user_id = actorUserId;

      await this.interviewRepository.save(current, { manager });

      const created = await this.interviewRepository.createAndSave(
        {
          application_id: current.application_id,
          interview_round_id: current.interview_round_id,
          scheduled_start_at: startAt,
          scheduled_end_at: endAt,
          interview_mode: current.interview_mode,
          meeting_link: meetingLink,
          location_details: locationDetails,
          interview_status: InterviewStatus.SCHEDULED,
          scheduled_by_user_id: actorUserId,
          rescheduled_from_interview_id: current.id,
          reschedule_reason: String(dto.reschedule_reason).trim(),
          cancel_reason: null,
          completed_at: null,
          created_by_user_id: actorUserId,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const loaded = await this.interviewRepository.findById(created.id, {
        manager,
        withRelations: true,
      });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_POST_RESCHEDULE_LOAD_FAILED',
        });
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.INTERVIEW,
          entityId: current.id,
          actionType: ActivityActionType.STATUS_CHANGE,
          actorUserId,
          oldValues: { interview_status: oldStatus },
          newValues: {
            interview_status: current.interview_status,
            reschedule_reason_present: Boolean(dto.reschedule_reason),
          },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.INTERVIEW,
          entityId: loaded.id,
          actionType: ActivityActionType.CREATE,
          actorUserId,
          oldValues: null,
          newValues: {
            application_id: loaded.application_id,
            interview_round_id: loaded.interview_round_id,
            interview_status: loaded.interview_status,
            interview_mode: loaded.interview_mode,
            scheduled_start_at:
              loaded.scheduled_start_at?.toISOString?.() ?? null,
            scheduled_end_at: loaded.scheduled_end_at?.toISOString?.() ?? null,
            rescheduled_from_interview_id: loaded.rescheduled_from_interview_id,
            reschedule_reason_present: Boolean(dto.reschedule_reason),
          },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      return loaded;
    });
  }
}
