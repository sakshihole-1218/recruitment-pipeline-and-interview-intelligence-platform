import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeminiClient } from '../../common/ai/gemini/gemini.client';

import { ApplicationEntity } from '../applications/entities/application.entity';
import { CandidateEntity } from '../candidates/entities/candidate.entity';
import { JobOpeningEntity } from '../job-openings/entities/job-opening.entity';
import { JobOpeningSkillEntity } from '../job-openings/entities/job-opening-skill.entity';
import { ResumeAiAnalysisEntity } from '../aiInsights/entities/resume-ai-analysis.entity';
import { AiInterviewSessionEntity } from '../aiInterviewSessions/entities/ai-interview-session.entity';
import { AiInterviewTranscriptEntity } from '../aiInterviewTranscripts/entities/ai-interview-transcript.entity';
import { AiInterviewTranscriptRepository } from '../aiInterviewTranscripts/repositories/ai-interview-transcript.repository';

import { AiInterviewQuestionsController } from './controllers/ai-interview-questions.controller';
import { AiInterviewConversationMemoryService } from './application/services/ai-interview-conversation-memory.service';
import { AiInterviewQuestionsService } from './application/services/ai-interview-questions.service';
import { AiInterviewQuestionEntity } from './entities/ai-interview-question.entity';
import { AiInterviewQuestionRepository } from './repositories/ai-interview-question.repository';
import { AiInterviewQuestionsReferenceRepository } from './repositories/ai-interview-questions-reference.repository';
import { AiInterviewQuestionsValidationHelper } from './helpers/ai-interview-questions-validation.helper';
import { CreateInterviewQuestionUseCase } from './application/use-cases/create-interview-question.usecase';
import { DeleteInterviewQuestionUseCase } from './application/use-cases/delete-interview-question.usecase';
import { GenerateInterviewPlanUseCase } from './application/use-cases/generate-interview-plan.usecase';
import { GenerateFollowUpQuestionUseCase } from './application/use-cases/generate-follow-up-question.usecase';
import { GetInterviewQuestionByIdUseCase } from './application/use-cases/get-interview-question-by-id.usecase';
import { GetQuestionsBySessionUseCase } from './application/use-cases/get-questions-by-session.usecase';
import { ListInterviewQuestionsUseCase } from './application/use-cases/list-interview-questions.usecase';
import { MarkQuestionAnsweredUseCase } from './application/use-cases/mark-question-answered.usecase';
import { MarkQuestionAskedUseCase } from './application/use-cases/mark-question-asked.usecase';
import { UpdateInterviewQuestionUseCase } from './application/use-cases/update-interview-question.usecase';
import { AI_INTERVIEW_QUESTION_PROVIDER } from './providers/ai-interview-question-provider';
import { GeminiAiInterviewQuestionProvider } from './providers/gemini-ai-interview-question.provider';
import { MockAiInterviewQuestionProvider } from './providers/mock-ai-interview-question.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiInterviewQuestionEntity,
      AiInterviewSessionEntity,
      ResumeAiAnalysisEntity,
      ApplicationEntity,
      CandidateEntity,
      JobOpeningEntity,
      JobOpeningSkillEntity,
      AiInterviewTranscriptEntity,
    ]),
  ],
  controllers: [AiInterviewQuestionsController],
  providers: [
    AiInterviewQuestionsService,
    AiInterviewConversationMemoryService,
    AiInterviewQuestionRepository,
    AiInterviewTranscriptRepository,
    AiInterviewQuestionsReferenceRepository,
    AiInterviewQuestionsValidationHelper,
    {
      provide: AI_INTERVIEW_QUESTION_PROVIDER,
      inject: [
        ConfigService,
        MockAiInterviewQuestionProvider,
        GeminiAiInterviewQuestionProvider,
      ],
      useFactory: (
        configService: ConfigService,
        mockProvider: MockAiInterviewQuestionProvider,
        geminiProvider: GeminiAiInterviewQuestionProvider,
      ) => {
        return configService.get<string>('AI_PROVIDER', 'mock') === 'gemini'
          ? geminiProvider
          : mockProvider;
      },
    },
    GeminiClient,
    MockAiInterviewQuestionProvider,
    GeminiAiInterviewQuestionProvider,
    GenerateInterviewPlanUseCase,
    GenerateFollowUpQuestionUseCase,
    CreateInterviewQuestionUseCase,
    UpdateInterviewQuestionUseCase,
    MarkQuestionAskedUseCase,
    MarkQuestionAnsweredUseCase,
    GetInterviewQuestionByIdUseCase,
    GetQuestionsBySessionUseCase,
    ListInterviewQuestionsUseCase,
    DeleteInterviewQuestionUseCase,
  ],
  exports: [AiInterviewQuestionsService],
})
export class AiInterviewQuestionsModule {}
