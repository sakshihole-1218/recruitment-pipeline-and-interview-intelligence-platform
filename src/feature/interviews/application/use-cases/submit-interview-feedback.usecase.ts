import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationEntity } from '../../../applications/entities/application.entity';
import { ApplicationCurrentStage } from '../../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../../applications/enums/application-status.enum';
import { SubmitInterviewFeedbackDto } from '../../dto/submit-interview-feedback.dto';
import { InterviewFeedbackEntity } from '../../entities/interview-feedback.entity';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewsValidationHelper } from '../../helpers/interviews-validation.helper';
import { InterviewFeedbackRepository } from '../../repositories/interview-feedback.repository';
import { InterviewPanelMemberRepository } from '../../repositories/interview-panel-member.repository';
import { InterviewRepository } from '../../repositories/interview.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class SubmitInterviewFeedbackUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly panelMemberRepository: InterviewPanelMemberRepository,
    private readonly feedbackRepository: InterviewFeedbackRepository,
    private readonly validationHelper: InterviewsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    interviewId: string,
    dto: SubmitInterviewFeedbackDto,
    actorUserId: string,
  ): Promise<InterviewFeedbackEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const interview = await this.interviewRepository.findById(interviewId, {
        manager,
      });

      if (!interview) {
        throw new NotFoundException({
          message: 'Interview not found',
          code: 'INTERVIEW_NOT_FOUND',
        });
      }

      if (interview.interview_status !== InterviewStatus.COMPLETED) {
        throw new ConflictException({
          message: 'Feedback can only be submitted for completed interviews',
          code: 'INTERVIEW_FEEDBACK_INVALID_STATUS',
        });
      }

      const application = await manager
        .getRepository(ApplicationEntity)
        .createQueryBuilder('applications')
        .where('applications.id = :id', { id: interview.application_id })
        .andWhere('applications.deleted_at IS NULL')
        .getOne();

      if (!application) {
        throw new NotFoundException({
          message: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      if (application.application_status !== ApplicationStatus.ACTIVE) {
        throw new ConflictException({
          message: 'Feedback can only be submitted for ACTIVE applications',
          code: 'APPLICATION_NOT_ACTIVE_FOR_FEEDBACK',
          meta: { application_status: application.application_status },
        });
      }

      if (application.current_stage !== ApplicationCurrentStage.INTERVIEW) {
        throw new ConflictException({
          message: 'Feedback can only be submitted when application is in INTERVIEW stage',
          code: 'APPLICATION_NOT_IN_INTERVIEW_STAGE_FOR_FEEDBACK',
          meta: { current_stage: application.current_stage },
        });
      }

      const isPanelMember = await this.panelMemberRepository.findByInterviewAndUser(
        interviewId,
        actorUserId,
        { manager },
      );

      if (!isPanelMember) {
        throw new ForbiddenException({
          message: 'Only assigned panel members can submit feedback',
          code: 'INTERVIEWER_NOT_IN_PANEL',
        });
      }

      const existing = await this.feedbackRepository.findByInterviewAndInterviewer(
        interviewId,
        actorUserId,
        { includeDeleted: true, manager },
      );

      if (existing && !existing.deleted_at) {
        throw new ConflictException({
          message: 'Feedback already submitted for this interview',
          code: 'INTERVIEW_FEEDBACK_ALREADY_SUBMITTED',
        });
      }

      const now = new Date();
      const overall = this.validationHelper.computeOverallScore(dto);

      if (existing && existing.deleted_at) {
        const feedbackId = existing.id;
        existing.deleted_at = null;
        existing.deleted_by_user_id = null;
        existing.updated_by_user_id = actorUserId;
        existing.technical_score = dto.technical_score;
        existing.communication_score = dto.communication_score;
        existing.problem_solving_score = dto.problem_solving_score;
        existing.culture_fit_score = dto.culture_fit_score;
        existing.overall_score = overall;
        existing.strengths = dto.strengths?.trim() || null;
        existing.concerns = dto.concerns?.trim() || null;
        existing.detailed_feedback = dto.detailed_feedback?.trim() || null;
        existing.recommendation = dto.recommendation;
        existing.submitted_at = now;

        await this.feedbackRepository.save(existing, { manager });
        const loaded = await this.feedbackRepository.findByInterviewAndInterviewer(
          interviewId,
          actorUserId,
          { manager },
        );

        if (!loaded) {
          throw new ConflictException({
            message: 'We could not complete the request. Please try again',
            code: 'INTERVIEW_FEEDBACK_POST_SUBMIT_LOAD_FAILED',
          });
        }

        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.INTERVIEW,
            entityId: interviewId,
            actionType: ActivityActionType.UPDATE,
            actorUserId,
            oldValues: { feedback_id: feedbackId, deleted_at_present: true },
            newValues: {
              feedback_id: loaded.id,
              interviewer_user_id: loaded.interviewer_user_id,
              submitted_at: loaded.submitted_at?.toISOString?.() ?? null,
              overall_score: loaded.overall_score,
              recommendation: loaded.recommendation,
              deleted_at_present: false,
              changed_fields: ['feedback'],
            },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );

        return loaded;
      }

      const created = await this.feedbackRepository.createAndSave(
        {
          interview_id: interviewId,
          interviewer_user_id: actorUserId,
          technical_score: dto.technical_score,
          communication_score: dto.communication_score,
          problem_solving_score: dto.problem_solving_score,
          culture_fit_score: dto.culture_fit_score,
          overall_score: overall,
          strengths: dto.strengths?.trim() || null,
          concerns: dto.concerns?.trim() || null,
          detailed_feedback: dto.detailed_feedback?.trim() || null,
          recommendation: dto.recommendation,
          submitted_at: now,
          created_by_user_id: actorUserId,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const loaded = await this.feedbackRepository.findByInterviewAndInterviewer(
        interviewId,
        actorUserId,
        { manager },
      );

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_FEEDBACK_POST_SUBMIT_LOAD_FAILED',
        });
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.INTERVIEW,
          entityId: interviewId,
          actionType: ActivityActionType.CREATE,
          actorUserId,
          oldValues: null,
          newValues: {
            feedback_id: loaded.id,
            interviewer_user_id: loaded.interviewer_user_id,
            submitted_at: loaded.submitted_at?.toISOString?.() ?? null,
            overall_score: loaded.overall_score,
            recommendation: loaded.recommendation,
            changed_fields: ['feedback'],
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
