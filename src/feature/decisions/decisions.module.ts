import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../accessControl/entities/user.entity';
import { UserRepository } from '../accessControl/repositories/user.repository';
import { AiInterviewFeedbackEntity } from '../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { AiInterviewFeedbackRepository } from '../aiInterviewFeedback/repositories/ai-interview-feedback.repository';
import { AiInterviewSessionEntity } from '../aiInterviewSessions/entities/ai-interview-session.entity';
import { AiInterviewSessionRepository } from '../aiInterviewSessions/repositories/ai-interview-session.repository';
import { InterviewerReviewEntity } from '../aiInterviewerReviews/entities/interviewer-review.entity';
import { InterviewerReviewRepository } from '../aiInterviewerReviews/repositories/interviewer-review.repository';
import { InterviewProctoringEventEntity } from '../aiInterviewProctoringEvents/entities/interview-proctoring-event.entity';
import { InterviewProctoringEventsRepository } from '../aiInterviewProctoringEvents/repositories/interview-proctoring-events.repository';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { ApplicationStageHistoryEntity } from '../applications/entities/application-stage-history.entity';
import { ApplicationRepository } from '../applications/repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../applications/repositories/application-stage-history.repository';
import { OfferEntity } from '../offers/entities/offer.entity';
import { OfferRepository } from '../offers/repositories/offer.repository';
import { DecisionsController } from './controllers/decisions.controller';
import { DecisionsService } from './application/services/decisions.service';
import { ApplicationDecisionEntity } from './entities/application-decision.entity';
import { ApplicationDecisionRepository } from './repositories/application-decision.repository';
import { DecisionScoreHelper } from './helpers/decision-score.helper';
import { DecisionSnapshotHelper } from './helpers/decision-snapshot.helper';
import { DecisionTransitionValidator } from './helpers/decision-transition.validator';
import { DecisionsPaginationHelper } from './helpers/decisions-pagination.helper';
import { DecisionsValidationHelper } from './helpers/decisions-validation.helper';
import { ValidateMandatoryInterviewsHelper } from './helpers/validate-mandatory-interviews.helper';
import { ValidateInterviewFeedbackHelper } from './helpers/validate-interview-feedback.helper';
import { DecisionsWorkflowValidationHelper } from './helpers/decisions-workflow-validation.helper';
import { CreateApplicationDecisionUseCase } from './application/use-cases/create-application-decision.usecase';
import { UpdateApplicationDecisionUseCase } from './application/use-cases/update-application-decision.usecase';
import { FindDecisionByIdUseCase } from './application/use-cases/find-decision-by-id.usecase';
import { FindDecisionByApplicationIdUseCase } from './application/use-cases/find-decision-by-application-id.usecase';
import { ListDecisionsUseCase } from './application/use-cases/list-decisions.usecase';
import { ListEligibleDecisionApplicationsUseCase } from './application/use-cases/list-eligible-decision-applications.usecase';
import { SoftDeleteDecisionUseCase } from './application/use-cases/soft-delete-decision.usecase';
import { ActivityLogsModule } from '../activityLogs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationDecisionEntity,
      ApplicationEntity,
      ApplicationStageHistoryEntity,
      OfferEntity,
      UserEntity,
      AiInterviewSessionEntity,
      AiInterviewFeedbackEntity,
      InterviewerReviewEntity,
      InterviewProctoringEventEntity,
    ]),
    ActivityLogsModule,
  ],
  controllers: [DecisionsController],
  providers: [
    // repositories
    ApplicationDecisionRepository,
    ApplicationRepository,
    ApplicationStageHistoryRepository,
    UserRepository,
    OfferRepository,
    AiInterviewSessionRepository,
    AiInterviewFeedbackRepository,
    InterviewerReviewRepository,
    InterviewProctoringEventsRepository,
    // helpers
    DecisionsPaginationHelper,
    DecisionsValidationHelper,
    DecisionTransitionValidator,
    DecisionScoreHelper,
    DecisionSnapshotHelper,
    ValidateMandatoryInterviewsHelper,
    ValidateInterviewFeedbackHelper,
    DecisionsWorkflowValidationHelper,
    // use-cases
    CreateApplicationDecisionUseCase,
    UpdateApplicationDecisionUseCase,
    FindDecisionByIdUseCase,
    FindDecisionByApplicationIdUseCase,
    ListDecisionsUseCase,
    ListEligibleDecisionApplicationsUseCase,
    SoftDeleteDecisionUseCase,
    // service
    DecisionsService,
  ],
  exports: [DecisionsService, ApplicationDecisionRepository],
})
export class DecisionsModule {}
