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
import { UserEntity } from '../../../accessControl/entities/user.entity';
import { ScheduleInterviewDto } from '../../dto/schedule-interview.dto';
import { InterviewEntity } from '../../entities/interview.entity';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewsValidationHelper } from '../../helpers/interviews-validation.helper';
import { CandidateResumeValidationHelper } from '../../helpers/candidate-resume-validation.helper';
import { InterviewPanelMemberRepository } from '../../repositories/interview-panel-member.repository';
import { InterviewRepository } from '../../repositories/interview.repository';
import { InterviewRoundRepository } from '../../repositories/interview-round.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class ScheduleInterviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly interviewRoundRepository: InterviewRoundRepository,
    private readonly panelMemberRepository: InterviewPanelMemberRepository,
    private readonly validationHelper: InterviewsValidationHelper,
    private readonly resumeValidation: CandidateResumeValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    dto: ScheduleInterviewDto,
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
      const application = await manager
        .getRepository(ApplicationEntity)
        .createQueryBuilder('applications')
        .where('applications.id = :id', { id: dto.application_id })
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
          message: 'Interview can only be scheduled for ACTIVE applications',
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
            'Interview can only be scheduled when application is in SHORTLISTED or INTERVIEW stage',
          code: 'APPLICATION_NOT_ELIGIBLE_FOR_INTERVIEW_STAGE',
          meta: { current_stage: application.current_stage },
        });
      }

      await this.resumeValidation.ensureLatestResumeExists({
        candidateId: application.candidate_id,
        manager,
      });

      const round = await this.interviewRoundRepository.findById(
        dto.interview_round_id,
        { manager },
      );

      if (!round) {
        throw new NotFoundException({
          message: 'Interview round not found',
          code: 'INTERVIEW_ROUND_NOT_FOUND',
        });
      }

      const startAt = new Date(dto.scheduled_start_at);
      const endAt = new Date(dto.scheduled_end_at);

      this.validationHelper.ensureValidScheduleWindow({ startAt, endAt });
      this.validationHelper.ensureScheduleNotInPast({ startAt });
      this.validationHelper.ensureModeDetails({
        mode: dto.interview_mode,
        meetingLink: dto.meeting_link ?? null,
        locationDetails: dto.location_details ?? null,
      });

      const duplicate = await this.interviewRepository.findDuplicateSchedule({
        applicationId: dto.application_id,
        interviewRoundId: dto.interview_round_id,
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

      let created: InterviewEntity;
      try {
        created = await this.interviewRepository.createAndSave(
          {
            application_id: dto.application_id,
            interview_round_id: dto.interview_round_id,
            scheduled_start_at: startAt,
            scheduled_end_at: endAt,
            interview_mode: dto.interview_mode,
            is_ai_interview: dto.is_ai_interview ?? false,
            meeting_link: dto.meeting_link?.trim() || null,
            location_details: dto.location_details?.trim() || null,
            interview_status: InterviewStatus.SCHEDULED,
            scheduled_by_user_id: actorUserId,
            rescheduled_from_interview_id: null,
            reschedule_reason: null,
            cancel_reason: null,
            completed_at: null,
            created_by_user_id: actorUserId,
            updated_by_user_id: null,
            deleted_by_user_id: null,
            deleted_at: null,
          },
          { manager },
        );
      } catch (error: any) {
        if (String(error?.code) === '23505') {
          throw new ConflictException({
            message: 'Interview is already scheduled for the same time window',
            code: 'INTERVIEW_DUPLICATE_SCHEDULE',
          });
        }
        throw error;
      }

      if (dto.members?.length) {
        this.validationHelper.ensureUniquePanelMembers(dto.members);

        const userIds = dto.members.map((m) => m.user_id);
        const users = await manager
          .getRepository(UserEntity)
          .createQueryBuilder('users')
          .where('users.id IN (:...userIds)', { userIds })
          .andWhere('users.deleted_at IS NULL')
          .getMany();

        const found = new Set(users.map((u) => u.id));
        const missing = userIds.filter((id) => !found.has(id));

        if (missing.length) {
          throw new BadRequestException({
            message: 'One or more panel members are invalid users',
            code: 'PANEL_MEMBER_INVALID_USER',
            meta: { missing_user_ids: missing },
          });
        }

        for (const member of dto.members) {
          await this.panelMemberRepository.createAndSave(
            {
              interview_id: created.id,
              user_id: member.user_id,
              role_in_panel: member.role_in_panel,
              deleted_at: null,
            },
            { manager },
          );
        }
      }

      const loaded = await this.interviewRepository.findById(created.id, {
        manager,
        withRelations: true,
      });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_POST_CREATE_LOAD_FAILED',
        });
      }

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
            is_ai_interview: loaded.is_ai_interview,
            scheduled_start_at:
              loaded.scheduled_start_at?.toISOString?.() ?? null,
            scheduled_end_at: loaded.scheduled_end_at?.toISOString?.() ?? null,
            panel_members_count: loaded.panel_members?.length ?? null,
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
