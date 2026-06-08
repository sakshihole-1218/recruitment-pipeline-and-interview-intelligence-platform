import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UserRepository } from '../../../accessControl/repositories/user.repository';
import { AiInterviewFeedbackEntity } from '../../../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { AiInterviewFeedbackStatus } from '../../../aiInterviewFeedback/enums/ai-interview-feedback-status.enum';
import { AiInterviewFeedbackRepository } from '../../../aiInterviewFeedback/repositories/ai-interview-feedback.repository';
import { AiInterviewSessionEntity } from '../../../aiInterviewSessions/entities/ai-interview-session.entity';
import { AiInterviewSessionStatus } from '../../../aiInterviewSessions/enums/ai-interview-session-status.enum';
import { AiInterviewSessionRepository } from '../../../aiInterviewSessions/repositories/ai-interview-session.repository';
import { InterviewerReviewStatus } from '../../../aiInterviewerReviews/enums/interviewer-review-status.enum';
import { InterviewerReviewEntity } from '../../../aiInterviewerReviews/entities/interviewer-review.entity';
import { InterviewerReviewRepository } from '../../../aiInterviewerReviews/repositories/interviewer-review.repository';
import { InterviewProctoringEventsRepository } from '../../../aiInterviewProctoringEvents/repositories/interview-proctoring-events.repository';
import { ApplicationRepository } from '../../../applications/repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../../applications/repositories/application-stage-history.repository';
import { ApplicationCurrentStage } from '../../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../../applications/enums/application-status.enum';
import { ApplicationEntity } from '../../../applications/entities/application.entity';
import { CreateApplicationDecisionDto } from '../../dto/create-application-decision.dto';
import { ApplicationDecisionEntity } from '../../entities/application-decision.entity';
import { DecisionSource } from '../../enums/decision-source.enum';
import { ApplicationDecisionRepository } from '../../repositories/application-decision.repository';
import { DecisionScoreHelper } from '../../helpers/decision-score.helper';
import { DecisionSnapshotHelper } from '../../helpers/decision-snapshot.helper';
import { DecisionsValidationHelper } from '../../helpers/decisions-validation.helper';
import { DecisionsApplicationStageHelper } from '../../helpers/decisions-application-stage.helper';
import { ValidateMandatoryInterviewsHelper } from '../../helpers/validate-mandatory-interviews.helper';
import { ValidateInterviewFeedbackHelper } from '../../helpers/validate-interview-feedback.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CreateApplicationDecisionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly decisionRepository: ApplicationDecisionRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly userRepository: UserRepository,
    private readonly aiInterviewSessionRepository: AiInterviewSessionRepository,
    private readonly aiInterviewFeedbackRepository: AiInterviewFeedbackRepository,
    private readonly interviewerReviewRepository: InterviewerReviewRepository,
    private readonly interviewProctoringEventsRepository: InterviewProctoringEventsRepository,
    private readonly validationHelper: DecisionsValidationHelper,
    private readonly decisionSnapshotHelper: DecisionSnapshotHelper,
    private readonly decisionScoreHelper: DecisionScoreHelper,
    private readonly mandatoryInterviewsHelper: ValidateMandatoryInterviewsHelper,
    private readonly feedbackHelper: ValidateInterviewFeedbackHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    dto: CreateApplicationDecisionDto,
    actorUserId: string,
  ): Promise<ApplicationDecisionEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
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

      const eligibleStages = [
        ApplicationCurrentStage.INTERVIEW,
        ApplicationCurrentStage.DECISION,
      ];

      if (!eligibleStages.includes(application.current_stage)) {
        throw new ConflictException({
          message:
            'Decision can only be created when application is in INTERVIEW or DECISION stage',
          code: 'APPLICATION_NOT_ELIGIBLE_FOR_DECISION',
          meta: { current_stage: application.current_stage },
        });
      }

      if (application.application_status !== ApplicationStatus.ACTIVE) {
        throw new ConflictException({
          message: 'Decision can only be created for ACTIVE applications',
          code: 'APPLICATION_NOT_ACTIVE_FOR_DECISION',
          meta: { application_status: application.application_status },
        });
      }

      const actor = await this.userRepository.findById(actorUserId, { manager });
      if (!actor) {
        throw new NotFoundException({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      const decidedByUserId = dto.decided_by_user_id ?? actor.id;
      const decidedByUser = await this.userRepository.findById(decidedByUserId, {
        manager,
      });
      if (!decidedByUser) {
        throw new NotFoundException({
          message: 'Decided-by user not found',
          code: 'DECIDER_USER_NOT_FOUND',
        });
      }

      const existing = await this.decisionRepository.findByApplicationId(
        application.id,
        { manager },
      );

      if (existing) {
        throw new ConflictException({
          message: 'A final decision already exists for this application',
          code: 'DECISION_ALREADY_EXISTS_FOR_APPLICATION',
        });
      }

      const decisionReason = this.validationHelper.normalizeReason(
        dto.decision_reason,
      );
      const decisionNotes = this.validationHelper.normalizeNotes(
        dto.decision_notes,
      );

      this.validationHelper.ensureReasonRules({
        decision_status: dto.decision_status,
        decision_reason: decisionReason,
      });

      let aiSession: AiInterviewSessionEntity | null = null;
      let aiFeedback: AiInterviewFeedbackEntity | null = null;

      if (dto.ai_interview_session_id) {
        aiSession = await this.aiInterviewSessionRepository.findById(
          dto.ai_interview_session_id,
          { manager },
        );

        if (!aiSession) {
          throw new NotFoundException({
            message: 'AI interview session not found',
            code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
          });
        }

        this.ensureAiSessionBelongsToApplication(aiSession, application.id);
        this.ensureAiSessionCompleted(aiSession);
      }

      if (dto.ai_interview_feedback_id) {
        aiFeedback = await this.aiInterviewFeedbackRepository.findById(
          dto.ai_interview_feedback_id,
          { manager },
        );

        if (!aiFeedback) {
          throw new NotFoundException({
            message: 'AI interview feedback not found',
            code: 'AI_INTERVIEW_FEEDBACK_NOT_FOUND',
          });
        }

        this.ensureAiFeedbackBelongsToApplication(aiFeedback, application.id);
        this.ensureAiFeedbackCompleted(aiFeedback);
      }

      if (!aiFeedback && aiSession && dto.decision_source) {
        const sessionFeedback =
          await this.aiInterviewFeedbackRepository.findBySessionId(aiSession.id, {
            manager,
          });

        if (sessionFeedback) {
          this.ensureAiFeedbackBelongsToApplication(
            sessionFeedback,
            application.id,
          );
          this.ensureAiFeedbackCompleted(sessionFeedback);
          aiFeedback = sessionFeedback;
        }
      }

      if (!aiSession && aiFeedback) {
        aiSession = await this.aiInterviewSessionRepository.findById(
          aiFeedback.ai_interview_session_id,
          { manager },
        );

        if (!aiSession) {
          throw new ConflictException({
            message: 'AI interview session not found for feedback',
            code: 'AI_INTERVIEW_SESSION_FOR_FEEDBACK_NOT_FOUND',
          });
        }

        this.ensureAiSessionBelongsToApplication(aiSession, application.id);
        this.ensureAiSessionCompleted(aiSession);
      }

      if (
        aiSession &&
        aiFeedback &&
        aiFeedback.ai_interview_session_id !== aiSession.id
      ) {
        throw new BadRequestException({
          message:
            'AI interview feedback does not belong to the provided AI interview session',
          code: 'AI_FEEDBACK_SESSION_MISMATCH',
        });
      }

      const hasHumanInterviewFeedback =
        await this.feedbackHelper.hasAnyInterviewFeedbackForApplication({
          applicationId: application.id,
          manager,
        });

      const decisionSource = this.validationHelper.resolveDecisionSource({
        requestedSource: dto.decision_source,
        hasHumanInterviewFeedback,
        hasAiInterviewFeedback: Boolean(aiFeedback),
      });

      if (decisionSource === DecisionSource.HUMAN_INTERVIEW) {
        const { mandatoryRoundIds } =
          await this.mandatoryInterviewsHelper.ensureAllMandatoryRoundsCompleted({
            applicationId: application.id,
            jobOpeningId: application.job_opening_id,
            manager,
          });

        await this.feedbackHelper.ensureFeedbackExistsForMandatoryRounds({
          applicationId: application.id,
          mandatoryRoundIds,
          manager,
        });
      }

      const interviewerReviews = aiSession
        ? await this.interviewerReviewRepository.findBySessionId(aiSession.id, {
            manager,
          })
        : [];

      const submittedAiReviews = interviewerReviews.filter(
        (review) => review.review_status === InterviewerReviewStatus.SUBMITTED,
      );

      this.validationHelper.ensureDecisionSourceRules({
        decisionSource,
        hasHumanInterviewFeedback,
        hasAiInterviewFeedback: Boolean(aiFeedback),
        hasSubmittedAiReview: submittedAiReviews.length > 0,
      });

      const proctoringEvents = aiSession
        ? await this.interviewProctoringEventsRepository.getEventsForRiskSummary(
            aiSession.id,
            { manager },
          )
        : [];

      const aiRecommendationSnapshot =
        this.decisionSnapshotHelper.buildAiRecommendationSnapshot(aiFeedback);
      const interviewerRecommendationSnapshot =
        this.decisionSnapshotHelper.buildInterviewerRecommendationSnapshot(
          interviewerReviews,
        );
      const proctoringRiskSnapshot =
        this.decisionSnapshotHelper.buildProctoringRiskSnapshot(proctoringEvents);
      const finalScore = this.decisionScoreHelper.calculateFinalScore({
        aiFeedback,
        interviewerReviews,
      });

      const now = new Date();

      const stageChanges: Array<{
        from: ApplicationCurrentStage;
        to: ApplicationCurrentStage;
        reason: string | null;
      }> = [];

      
      if (application.current_stage === ApplicationCurrentStage.INTERVIEW) {
        await this.stageHistoryRepository.createAndSave(
          {
            application_id: application.id,
            from_stage: ApplicationCurrentStage.INTERVIEW,
            to_stage: ApplicationCurrentStage.DECISION,
            changed_by_user_id: actor.id,
            change_reason: null,
            changed_at: now,
            deleted_at: null,
          },
          { manager },
        );

        stageChanges.push({
          from: ApplicationCurrentStage.INTERVIEW,
          to: ApplicationCurrentStage.DECISION,
          reason: null,
        });

        application.current_stage = ApplicationCurrentStage.DECISION;
        application.last_stage_changed_at = now;
        application.updated_by_user_id = actor.id;
        await this.applicationRepository.save(application, { manager });
      }

      let created: ApplicationDecisionEntity;
      try {
        created = await this.decisionRepository.createAndSave(
          {
            application_id: application.id,
            decision_status: dto.decision_status,
            decision_reason: decisionReason,
            decision_notes: decisionNotes,
            decided_by_user_id: decidedByUser.id,
            ai_interview_session_id: aiSession?.id ?? null,
            ai_interview_feedback_id: aiFeedback?.id ?? null,
            decision_source: decisionSource,
            final_score: finalScore,
            ai_recommendation_snapshot: aiRecommendationSnapshot,
            interviewer_recommendation_snapshot:
              interviewerRecommendationSnapshot,
            proctoring_risk_snapshot: proctoringRiskSnapshot,
            decision_at: now,
            created_by_user_id: actor.id,
            updated_by_user_id: null,
            deleted_by_user_id: null,
            deleted_at: null,
          },
          { manager },
        );
      } catch (error: any) {
        if (String(error?.code) === '23505') {
          throw new ConflictException({
            message: 'A final decision already exists for this application',
            code: 'DECISION_ALREADY_EXISTS_FOR_APPLICATION',
          });
        }
        throw error;
      }

      const mapped = DecisionsApplicationStageHelper.mapDecisionToApplicationState(
        {
          decision_status: created.decision_status,
          decision_reason: created.decision_reason,
        },
      );

      const fromStage = application.current_stage;
      const toStage = mapped.current_stage;

      if (fromStage !== toStage) {
        await this.stageHistoryRepository.createAndSave(
          {
            application_id: application.id,
            from_stage: fromStage,
            to_stage: toStage,
            changed_by_user_id: actor.id,
            change_reason: created.decision_reason,
            changed_at: now,
            deleted_at: null,
          },
          { manager },
        );

        stageChanges.push({
          from: fromStage,
          to: toStage,
          reason: created.decision_reason,
        });

        application.current_stage = toStage;
        application.last_stage_changed_at = now;
      }

      application.application_status = mapped.application_status;
      application.rejection_reason = mapped.rejection_reason;
      application.withdrawal_reason = null;
      application.updated_by_user_id = actor.id;

      await this.applicationRepository.save(application, { manager });

      const loaded = await this.decisionRepository.findById(created.id, {
        manager,
      });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'DECISION_POST_CREATE_LOAD_FAILED',
        });
      }

      for (const sc of stageChanges) {
        await this.activityWriter.log(
          ActivityLogBuilder.stageChange({
            entityType: ActivityEntityType.APPLICATION,
            entityId: application.id,
            fromStage: sc.from,
            toStage: sc.to,
            reason: sc.reason,
            actorUserId: actor.id,
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.DECISION,
          entityId: loaded.id,
          actionType: ActivityActionType.CREATE,
          actorUserId: actor.id,
          oldValues: null,
          newValues: {
            application_id: loaded.application_id,
            decision_status: loaded.decision_status,
              decision_source: loaded.decision_source,
              final_score: loaded.final_score,
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

  private ensureAiSessionBelongsToApplication(
    session: AiInterviewSessionEntity,
    applicationId: string,
  ): void {
    if (session.application_id !== applicationId) {
      throw new BadRequestException({
        message:
          'AI interview session does not belong to the same application',
        code: 'AI_INTERVIEW_SESSION_APPLICATION_MISMATCH',
      });
    }
  }

  private ensureAiSessionCompleted(session: AiInterviewSessionEntity): void {
    if (session.session_status !== AiInterviewSessionStatus.COMPLETED) {
      throw new ConflictException({
        message: 'AI interview session must be COMPLETED',
        code: 'AI_INTERVIEW_SESSION_NOT_COMPLETED',
        meta: { session_status: session.session_status },
      });
    }
  }

  private ensureAiFeedbackBelongsToApplication(
    feedback: AiInterviewFeedbackEntity,
    applicationId: string,
  ): void {
    if (feedback.application_id !== applicationId) {
      throw new BadRequestException({
        message:
          'AI interview feedback does not belong to the same application',
        code: 'AI_INTERVIEW_FEEDBACK_APPLICATION_MISMATCH',
      });
    }
  }

  private ensureAiFeedbackCompleted(feedback: AiInterviewFeedbackEntity): void {
    if (feedback.feedback_status !== AiInterviewFeedbackStatus.COMPLETED) {
      throw new ConflictException({
        message: 'AI interview feedback must be COMPLETED',
        code: 'AI_INTERVIEW_FEEDBACK_NOT_COMPLETED',
        meta: { feedback_status: feedback.feedback_status },
      });
    }
  }
}
