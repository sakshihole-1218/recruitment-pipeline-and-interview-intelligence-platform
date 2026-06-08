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
import { InterviewerReviewRepository } from '../../../aiInterviewerReviews/repositories/interviewer-review.repository';
import { InterviewProctoringEventsRepository } from '../../../aiInterviewProctoringEvents/repositories/interview-proctoring-events.repository';
import { ApplicationEntity } from '../../../applications/entities/application.entity';
import { ApplicationCurrentStage } from '../../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../../applications/enums/application-status.enum';
import { ApplicationRepository } from '../../../applications/repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../../applications/repositories/application-stage-history.repository';
import { OfferRepository } from '../../../offers/repositories/offer.repository';
import { UpdateApplicationDecisionDto } from '../../dto/update-application-decision.dto';
import { ApplicationDecisionEntity } from '../../entities/application-decision.entity';
import { DecisionSource } from '../../enums/decision-source.enum';
import { DecisionScoreHelper } from '../../helpers/decision-score.helper';
import { DecisionSnapshotHelper } from '../../helpers/decision-snapshot.helper';
import { DecisionTransitionValidator } from '../../helpers/decision-transition.validator';
import { ApplicationDecisionRepository } from '../../repositories/application-decision.repository';
import { DecisionsValidationHelper } from '../../helpers/decisions-validation.helper';
import { DecisionsApplicationStageHelper } from '../../helpers/decisions-application-stage.helper';
import { DecisionsWorkflowValidationHelper } from '../../helpers/decisions-workflow-validation.helper';
import { DecisionStatus } from '../../enums/decision-status.enum';
import { ValidateInterviewFeedbackHelper } from '../../helpers/validate-interview-feedback.helper';
import { ValidateMandatoryInterviewsHelper } from '../../helpers/validate-mandatory-interviews.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class UpdateApplicationDecisionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly decisionRepository: ApplicationDecisionRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly offerRepository: OfferRepository,
    private readonly userRepository: UserRepository,
    private readonly aiInterviewSessionRepository: AiInterviewSessionRepository,
    private readonly aiInterviewFeedbackRepository: AiInterviewFeedbackRepository,
    private readonly interviewerReviewRepository: InterviewerReviewRepository,
    private readonly interviewProctoringEventsRepository: InterviewProctoringEventsRepository,
    private readonly validationHelper: DecisionsValidationHelper,
    private readonly transitionValidator: DecisionTransitionValidator,
    private readonly decisionSnapshotHelper: DecisionSnapshotHelper,
    private readonly decisionScoreHelper: DecisionScoreHelper,
    private readonly workflowValidationHelper: DecisionsWorkflowValidationHelper,
    private readonly validateMandatoryInterviewsHelper: ValidateMandatoryInterviewsHelper,
    private readonly validateInterviewFeedbackHelper: ValidateInterviewFeedbackHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    id: string,
    dto: UpdateApplicationDecisionDto,
    actorUserId: string,
  ): Promise<ApplicationDecisionEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const actor = await this.userRepository.findById(actorUserId, { manager });
      if (!actor) {
        throw new NotFoundException({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      const decision = await this.decisionRepository.findById(id, { manager });
      if (!decision) {
        throw new NotFoundException({
          message: 'Decision not found',
          code: 'DECISION_NOT_FOUND',
        });
      }

      const nextStatus = dto.decision_status ?? decision.decision_status;
      const nextReason =
        dto.decision_reason !== undefined
          ? this.validationHelper.normalizeReason(dto.decision_reason)
          : decision.decision_reason;
      const nextNotes =
        dto.decision_notes !== undefined
          ? this.validationHelper.normalizeNotes(dto.decision_notes)
          : decision.decision_notes;

      const isStatusChange =
        dto.decision_status !== undefined &&
        dto.decision_status !== decision.decision_status;

      const isReasonUpdate = dto.decision_reason !== undefined;
      const isNotesUpdate = dto.decision_notes !== undefined;
      const isSourceUpdate = dto.decision_source !== undefined;

      this.validationHelper.ensureReasonRules({
        decision_status: nextStatus,
        decision_reason: nextReason,
      });

      if (isStatusChange) {
        this.transitionValidator.ensureAllowed({
          from: decision.decision_status,
          to: nextStatus,
        });
      }

      const application = await manager
        .getRepository(ApplicationEntity)
        .createQueryBuilder('applications')
        .where('applications.deleted_at IS NULL')
        .andWhere('applications.id = :id', { id: decision.application_id })
        .setLock('pessimistic_write')
        .getOne();

      if (!application) {
        throw new ConflictException({
          message: 'Application not found for decision',
          code: 'DECISION_APPLICATION_NOT_FOUND',
        });
      }

      this.workflowValidationHelper.ensureApplicationStateAllowsDecisionUpdate(
        application,
      );

      let aiSession: AiInterviewSessionEntity | null = null;
      let aiFeedback: AiInterviewFeedbackEntity | null = null;

      if (decision.ai_interview_session_id) {
        aiSession = await this.aiInterviewSessionRepository.findById(
          decision.ai_interview_session_id,
          { manager },
        );

        if (!aiSession) {
          throw new ConflictException({
            message: 'AI interview session not found for decision',
            code: 'DECISION_AI_SESSION_NOT_FOUND',
          });
        }

        this.ensureAiSessionBelongsToApplication(aiSession, application.id);
        this.ensureAiSessionCompleted(aiSession);
      }

      if (decision.ai_interview_feedback_id) {
        aiFeedback = await this.aiInterviewFeedbackRepository.findById(
          decision.ai_interview_feedback_id,
          { manager },
        );

        if (!aiFeedback) {
          throw new ConflictException({
            message: 'AI interview feedback not found for decision',
            code: 'DECISION_AI_FEEDBACK_NOT_FOUND',
          });
        }

        this.ensureAiFeedbackBelongsToApplication(aiFeedback, application.id);
        this.ensureAiFeedbackCompleted(aiFeedback);
      }

      if (!aiFeedback && aiSession) {
        const sessionFeedback =
          await this.aiInterviewFeedbackRepository.findBySessionId(aiSession.id, {
            manager,
          });

        if (
          sessionFeedback &&
          sessionFeedback.feedback_status === AiInterviewFeedbackStatus.COMPLETED
        ) {
          this.ensureAiFeedbackBelongsToApplication(
            sessionFeedback,
            application.id,
          );
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
            code: 'DECISION_AI_SESSION_FOR_FEEDBACK_NOT_FOUND',
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
        throw new ConflictException({
          message:
            'Stored AI interview feedback does not belong to the stored AI interview session',
          code: 'DECISION_AI_EVIDENCE_MISMATCH',
        });
      }

      const hasHumanInterviewFeedback =
        await this.validateInterviewFeedbackHelper.hasAnyInterviewFeedbackForApplication(
          {
            applicationId: application.id,
            manager,
          },
        );

      const nextDecisionSource = this.validationHelper.resolveDecisionSource({
        requestedSource: dto.decision_source ?? decision.decision_source,
        hasHumanInterviewFeedback,
        hasAiInterviewFeedback: Boolean(aiFeedback),
      });

      if (nextDecisionSource === DecisionSource.HUMAN_INTERVIEW) {
        await this.validateMandatoryInterviewsHelper.ensureAllMandatoryRoundsCompleted(
          {
            applicationId: application.id,
            jobOpeningId: application.job_opening_id,
            manager,
          },
        );

        const mandatoryRounds =
          await this.validateMandatoryInterviewsHelper.getMandatoryRounds({
            jobOpeningId: application.job_opening_id,
            manager,
          });

        await this.validateInterviewFeedbackHelper.ensureFeedbackExistsForMandatoryRounds(
          {
            applicationId: application.id,
            mandatoryRoundIds: mandatoryRounds.map((round) => round.id),
            manager,
          },
        );
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
        decisionSource: nextDecisionSource,
        hasHumanInterviewFeedback,
        hasAiInterviewFeedback: Boolean(aiFeedback),
        hasSubmittedAiReview: submittedAiReviews.length > 0,
      });

      const isApplicationHired =
        application.current_stage === ApplicationCurrentStage.HIRED ||
        application.application_status === ApplicationStatus.HIRED;

      if (isApplicationHired) {
        const attemptingNonHiredUpdate =
          nextStatus !== DecisionStatus.HIRED ||
          isReasonUpdate ||
          isNotesUpdate ||
          isSourceUpdate;

        if (attemptingNonHiredUpdate) {
          throw new ConflictException({
            message:
              'Decision cannot be updated after application is marked HIRED (except aligning decision to HIRED)',
            code: 'DECISION_UPDATE_NOT_ALLOWED_HIRED',
          });
        }
      }

      if (isStatusChange) {
        if (nextStatus === DecisionStatus.HIRED) {
          await this.workflowValidationHelper.ensureHiredDecisionConsistency({
            applicationId: application.id,
            manager,
            offerRepository: this.offerRepository,
          });
        } else {
          await this.workflowValidationHelper.ensureOfferStateAllowsDecisionUpdate(
            {
              applicationId: application.id,
              nextDecisionStatus: nextStatus,
              manager,
              offerRepository: this.offerRepository,
            },
          );
        }
      }

      if (!isStatusChange && (isReasonUpdate || isNotesUpdate || isSourceUpdate)) {
        if (nextStatus === DecisionStatus.HIRED) {
          throw new ConflictException({
            message: 'Decision details cannot be updated for HIRED decisions',
            code: 'DECISION_UPDATE_NOT_ALLOWED_HIRED',
          });
        }

        await this.workflowValidationHelper.ensureOfferStateAllowsDecisionUpdate({
          applicationId: application.id,
          nextDecisionStatus: nextStatus,
          manager,
          offerRepository: this.offerRepository,
        });
      }

      const stageChangeEvents: Array<{ fromStage: string; toStage: string }> =
        [];
      const now = new Date();
      const proctoringEvents = aiSession
        ? await this.interviewProctoringEventsRepository.getEventsForRiskSummary(
            aiSession.id,
            { manager },
          )
        : [];

      if (
        isStatusChange &&
        application.current_stage === ApplicationCurrentStage.INTERVIEW
      ) {
        const fromStage = application.current_stage;
        const toStage = ApplicationCurrentStage.DECISION;

        await this.stageHistoryRepository.createAndSave(
          {
            application_id: application.id,
            from_stage: fromStage,
            to_stage: toStage,
            changed_by_user_id: actor.id,
            change_reason: nextReason,
            changed_at: now,
            deleted_at: null,
          },
          { manager },
        );

        application.current_stage = toStage;
        application.last_stage_changed_at = now;
        stageChangeEvents.push({ fromStage, toStage });
      }

      decision.decision_status = nextStatus;
      decision.decision_reason = nextReason;
      decision.decision_notes = nextNotes;
      decision.ai_interview_session_id = aiSession?.id ?? null;
      decision.ai_interview_feedback_id = aiFeedback?.id ?? null;
      decision.decision_source = nextDecisionSource;
      decision.final_score = this.decisionScoreHelper.calculateFinalScore({
        aiFeedback,
        interviewerReviews,
      });
      decision.ai_recommendation_snapshot =
        this.decisionSnapshotHelper.buildAiRecommendationSnapshot(aiFeedback);
      decision.interviewer_recommendation_snapshot =
        this.decisionSnapshotHelper.buildInterviewerRecommendationSnapshot(
          interviewerReviews,
        );
      decision.proctoring_risk_snapshot =
        this.decisionSnapshotHelper.buildProctoringRiskSnapshot(proctoringEvents);
      decision.decision_at = now;
      decision.updated_by_user_id = actor.id;

      await this.decisionRepository.save(decision, { manager });

      const mapped = DecisionsApplicationStageHelper.mapDecisionToApplicationState(
        {
          decision_status: decision.decision_status,
          decision_reason: decision.decision_reason,
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
            change_reason: decision.decision_reason,
            changed_at: now,
            deleted_at: null,
          },
          { manager },
        );

        application.current_stage = toStage;
        application.last_stage_changed_at = now;
        stageChangeEvents.push({ fromStage, toStage });
      }

      application.application_status = mapped.application_status;
      application.rejection_reason = mapped.rejection_reason;
      application.withdrawal_reason = null;
      application.updated_by_user_id = actor.id;
      await this.applicationRepository.save(application, { manager });

      const loaded = await this.decisionRepository.findById(decision.id, {
        manager,
      });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'DECISION_POST_UPDATE_LOAD_FAILED',
        });
      }

      for (const evt of stageChangeEvents) {
        await this.activityWriter.log(
          ActivityLogBuilder.stageChange({
            entityType: ActivityEntityType.APPLICATION,
            entityId: application.id,
            fromStage: evt.fromStage,
            toStage: evt.toStage,
            reason: null,
            actorUserId: actor.id,
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      const changedFields = [] as string[];
      if (dto.decision_status !== undefined) changedFields.push('decision_status');
      if (dto.decision_reason !== undefined) changedFields.push('decision_reason');
      if (dto.decision_notes !== undefined) changedFields.push('decision_notes');
      if (dto.decision_source !== undefined) changedFields.push('decision_source');

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.DECISION,
          entityId: loaded.id,
          actionType: ActivityActionType.UPDATE,
          actorUserId: actor.id,
          oldValues: { changed_fields: changedFields },
          newValues: { changed_fields: changedFields },
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
