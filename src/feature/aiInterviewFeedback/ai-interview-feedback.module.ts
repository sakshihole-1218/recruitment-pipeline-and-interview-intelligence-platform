import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationEntity } from '../applications/entities/application.entity';
import { CandidateEntity } from '../candidates/entities/candidate.entity';
import { ResumeAiAnalysisEntity } from '../aiInsights/entities/resume-ai-analysis.entity';
import { AiInterviewQuestionEntity } from '../aiInterviewQuestions/entities/ai-interview-question.entity';
import { AiInterviewSessionEntity } from '../aiInterviewSessions/entities/ai-interview-session.entity';
import { AiInterviewTranscriptEntity } from '../aiInterviewTranscripts/entities/ai-interview-transcript.entity';

import { AiInterviewFeedbackService } from './application/services/ai-interview-feedback.service';
import { DeleteAiInterviewFeedbackUseCase } from './application/use-cases/delete-ai-interview-feedback.usecase';
import { GenerateAiInterviewFeedbackUseCase } from './application/use-cases/generate-ai-interview-feedback.usecase';
import { GetAiInterviewFeedbackByIdUseCase } from './application/use-cases/get-ai-interview-feedback-by-id.usecase';
import { GetFeedbackBySessionUseCase } from './application/use-cases/get-feedback-by-session.usecase';
import { ListAiInterviewFeedbackUseCase } from './application/use-cases/list-ai-interview-feedback.usecase';
import { RegenerateAiInterviewFeedbackUseCase } from './application/use-cases/regenerate-ai-interview-feedback.usecase';
import { UpdateAiInterviewFeedbackUseCase } from './application/use-cases/update-ai-interview-feedback.usecase';
import { AiInterviewFeedbackController } from './controllers/ai-interview-feedback.controller';
import { AiInterviewFeedbackEntity } from './entities/ai-interview-feedback.entity';
import { AiInterviewFeedbackValidationHelper } from './helpers/ai-interview-feedback-validation.helper';
import { AI_INTERVIEW_FEEDBACK_PROVIDER } from './providers/ai-interview-feedback-provider';
import { MockAiInterviewFeedbackProvider } from './providers/mock-ai-interview-feedback.provider';
import { AiInterviewFeedbackReferenceRepository } from './repositories/ai-interview-feedback-reference.repository';
import { AiInterviewFeedbackRepository } from './repositories/ai-interview-feedback.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiInterviewFeedbackEntity,
      AiInterviewSessionEntity,
      ApplicationEntity,
      CandidateEntity,
      ResumeAiAnalysisEntity,
      AiInterviewQuestionEntity,
      AiInterviewTranscriptEntity,
    ]),
  ],
  controllers: [AiInterviewFeedbackController],
  providers: [
    AiInterviewFeedbackService,
    AiInterviewFeedbackRepository,
    AiInterviewFeedbackReferenceRepository,
    AiInterviewFeedbackValidationHelper,
    {
      provide: AI_INTERVIEW_FEEDBACK_PROVIDER,
      useClass: MockAiInterviewFeedbackProvider,
    },
    MockAiInterviewFeedbackProvider,
    GenerateAiInterviewFeedbackUseCase,
    RegenerateAiInterviewFeedbackUseCase,
    GetAiInterviewFeedbackByIdUseCase,
    GetFeedbackBySessionUseCase,
    ListAiInterviewFeedbackUseCase,
    UpdateAiInterviewFeedbackUseCase,
    DeleteAiInterviewFeedbackUseCase,
  ],
  exports: [AiInterviewFeedbackService],
})
export class AiInterviewFeedbackModule {}