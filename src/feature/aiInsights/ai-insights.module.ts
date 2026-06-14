import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeminiClient } from '../../common/ai/gemini/gemini.client';

import { ApplicationEntity } from '../applications/entities/application.entity';
import { CandidateDocumentEntity } from '../candidates/entities/candidate-document.entity';
import { InterviewEntity } from '../interviews/entities/interview.entity';
import { InterviewFeedbackEntity } from '../interviews/entities/interview-feedback.entity';

import { FeedbackAiSummariesController } from './controllers/feedback-ai-summaries.controller';
import { ResumeAiAnalysesController } from './controllers/resume-ai-analyses.controller';
import { AiInsightsGeminiController } from './controllers/ai-insights-gemini.controller';

import { FeedbackAiSummariesService } from './application/services/feedback-ai-summaries.service';
import { ResumeAiAnalysesService } from './application/services/resume-ai-analyses.service';

import { FeedbackAiSummaryEntity } from './entities/feedback-ai-summary.entity';
import { ResumeAiAnalysisEntity } from './entities/resume-ai-analysis.entity';

import { AiInsightsValidationHelper } from './helpers/ai-insights-validation.helper';

import { FeedbackAiSummaryRepository } from './repositories/feedback-ai-summary.repository';
import { ResumeAiAnalysisRepository } from './repositories/resume-ai-analysis.repository';
import { AiInsightsReferenceRepository } from './repositories/ai-insights-reference.repository';

import { AI_INSIGHTS_PROVIDER } from './providers/ai-insights-provider';
import { GeminiAiInsightsProvider } from './providers/gemini-ai-insights.provider';
import { HeuristicAiInsightsProvider } from './providers/heuristic-ai-insights.provider';
import { MockAiInsightsProvider } from './providers/mock-ai-insights.provider';

import { CreateResumeAiAnalysisUseCase } from './application/use-cases/create-resume-ai-analysis.usecase';
import { RegenerateResumeAiAnalysisUseCase } from './application/use-cases/regenerate-resume-ai-analysis.usecase';
import { FindResumeAiAnalysisByIdUseCase } from './application/use-cases/find-resume-ai-analysis-by-id.usecase';
import { FindResumeAiAnalysisByCandidateDocumentIdUseCase } from './application/use-cases/find-resume-ai-analysis-by-candidate-document-id.usecase';
import { ListResumeAiAnalysesUseCase } from './application/use-cases/list-resume-ai-analyses.usecase';
import { StartResumeAiAnalysisUseCase } from './application/use-cases/start-resume-ai-analysis.usecase';
import { GetLatestResumeAiAnalysisByCandidateUseCase } from './application/use-cases/get-latest-resume-ai-analysis-by-candidate.usecase';
import { UpdateResumeAiAnalysisUseCase } from './application/use-cases/update-resume-ai-analysis.usecase';
import { DeleteResumeAiAnalysisUseCase } from './application/use-cases/delete-resume-ai-analysis.usecase';

import { GenerateFeedbackAiSummaryUseCase } from './application/use-cases/generate-feedback-ai-summary.usecase';
import { RegenerateFeedbackAiSummaryUseCase } from './application/use-cases/regenerate-feedback-ai-summary.usecase';
import { FindFeedbackAiSummaryByIdUseCase } from './application/use-cases/find-feedback-ai-summary-by-id.usecase';
import { FindFeedbackAiSummaryByApplicationIdUseCase } from './application/use-cases/find-feedback-ai-summary-by-application-id.usecase';
import { ListFeedbackAiSummariesUseCase } from './application/use-cases/list-feedback-ai-summaries.usecase';
import { DeleteFeedbackAiSummaryUseCase } from './application/use-cases/delete-feedback-ai-summary.usecase';
import { TestGeminiConnectionUseCase } from './application/use-cases/test-gemini-connection.usecase';

import { ActivityLogsModule } from '../activityLogs/activity-logs.module';
import { AiInsightsGeminiService } from './application/services/ai-insights-gemini.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResumeAiAnalysisEntity,
      FeedbackAiSummaryEntity,
      CandidateDocumentEntity,
      ApplicationEntity,
      InterviewEntity,
      InterviewFeedbackEntity,
    ]),
    ActivityLogsModule,
  ],
  controllers: [
    ResumeAiAnalysesController,
    FeedbackAiSummariesController,
    AiInsightsGeminiController,
  ],
  providers: [
    // provider abstraction
    {
      provide: AI_INSIGHTS_PROVIDER,
      inject: [ConfigService, MockAiInsightsProvider, GeminiAiInsightsProvider],
      useFactory: (
        configService: ConfigService,
        mockProvider: MockAiInsightsProvider,
        geminiProvider: GeminiAiInsightsProvider,
      ) => {
        return configService.get<string>('AI_PROVIDER', 'mock') === 'gemini'
          ? geminiProvider
          : mockProvider;
      },
    },
    GeminiClient,

    // repositories
    ResumeAiAnalysisRepository,
    FeedbackAiSummaryRepository,
    AiInsightsReferenceRepository,

    // helpers
    AiInsightsValidationHelper,

    // use-cases (resume)
    CreateResumeAiAnalysisUseCase,
    StartResumeAiAnalysisUseCase,
    RegenerateResumeAiAnalysisUseCase,
    FindResumeAiAnalysisByIdUseCase,
    FindResumeAiAnalysisByCandidateDocumentIdUseCase,
    GetLatestResumeAiAnalysisByCandidateUseCase,
    ListResumeAiAnalysesUseCase,
    UpdateResumeAiAnalysisUseCase,
    DeleteResumeAiAnalysisUseCase,

    // use-cases (feedback)
    GenerateFeedbackAiSummaryUseCase,
    RegenerateFeedbackAiSummaryUseCase,
    FindFeedbackAiSummaryByIdUseCase,
    FindFeedbackAiSummaryByApplicationIdUseCase,
    ListFeedbackAiSummariesUseCase,
    DeleteFeedbackAiSummaryUseCase,
    TestGeminiConnectionUseCase,

    // services
    ResumeAiAnalysesService,
    FeedbackAiSummariesService,
    AiInsightsGeminiService,

    // implementations
    HeuristicAiInsightsProvider,
    MockAiInsightsProvider,
    GeminiAiInsightsProvider,
  ],
  exports: [ResumeAiAnalysesService, FeedbackAiSummariesService],
})
export class AiInsightsModule {}
