import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthorizationModule } from '../../common/authorization/authorization.module';
import { UserEntity } from '../accessControl/entities/user.entity';
import { AiInterviewFeedbackEntity } from '../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { AiInterviewSessionEntity } from '../aiInterviewSessions/entities/ai-interview-session.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { CandidateEntity } from '../candidates/entities/candidate.entity';
import { InterviewPanelMemberEntity } from '../interviews/entities/interview-panel-member.entity';

import { InterviewerReviewsService } from './application/services/interviewer-reviews.service';
import { CreateInterviewerReviewUseCase } from './application/use-cases/create-interviewer-review.usecase';
import { DeleteInterviewerReviewUseCase } from './application/use-cases/delete-interviewer-review.usecase';
import { GetInterviewerReviewByIdUseCase } from './application/use-cases/get-interviewer-review-by-id.usecase';
import { GetReviewsByApplicationUseCase } from './application/use-cases/get-reviews-by-application.usecase';
import { GetReviewsBySessionUseCase } from './application/use-cases/get-reviews-by-session.usecase';
import { ListInterviewerReviewsUseCase } from './application/use-cases/list-interviewer-reviews.usecase';
import { SubmitInterviewerReviewUseCase } from './application/use-cases/submit-interviewer-review.usecase';
import { UpdateInterviewerReviewUseCase } from './application/use-cases/update-interviewer-review.usecase';
import { InterviewerReviewsController } from './controllers/interviewer-reviews.controller';
import { InterviewerReviewEntity } from './entities/interviewer-review.entity';
import { InterviewerReviewsValidationHelper } from './helpers/interviewer-reviews-validation.helper';
import { InterviewerReviewReferenceRepository } from './repositories/interviewer-review-reference.repository';
import { InterviewerReviewRepository } from './repositories/interviewer-review.repository';

@Module({
  imports: [
    AuthorizationModule,
    TypeOrmModule.forFeature([
      InterviewerReviewEntity,
      AiInterviewSessionEntity,
      AiInterviewFeedbackEntity,
      ApplicationEntity,
      CandidateEntity,
      UserEntity,
      InterviewPanelMemberEntity,
    ]),
  ],
  controllers: [InterviewerReviewsController],
  providers: [
    InterviewerReviewsService,
    InterviewerReviewRepository,
    InterviewerReviewReferenceRepository,
    InterviewerReviewsValidationHelper,
    CreateInterviewerReviewUseCase,
    UpdateInterviewerReviewUseCase,
    SubmitInterviewerReviewUseCase,
    GetInterviewerReviewByIdUseCase,
    GetReviewsBySessionUseCase,
    GetReviewsByApplicationUseCase,
    ListInterviewerReviewsUseCase,
    DeleteInterviewerReviewUseCase,
  ],
  exports: [InterviewerReviewsService],
})
export class AiInterviewReviewsModule {}
