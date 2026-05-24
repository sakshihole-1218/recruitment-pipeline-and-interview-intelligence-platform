import { Injectable } from '@nestjs/common';

import { GenerateFeedbackAiSummaryDto } from '../../dto/generate-feedback-ai-summary.dto';
import { ListFeedbackAiSummariesQueryDto } from '../../dto/list-feedback-ai-summaries.query.dto';
import { FeedbackAiSummaryEntity } from '../../entities/feedback-ai-summary.entity';
import { FeedbackAiSummaryListResult } from '../../repositories/feedback-ai-summary.repository';

import { FindFeedbackAiSummaryByApplicationIdUseCase } from '../use-cases/find-feedback-ai-summary-by-application-id.usecase';
import { FindFeedbackAiSummaryByIdUseCase } from '../use-cases/find-feedback-ai-summary-by-id.usecase';
import { GenerateFeedbackAiSummaryUseCase } from '../use-cases/generate-feedback-ai-summary.usecase';
import { ListFeedbackAiSummariesUseCase } from '../use-cases/list-feedback-ai-summaries.usecase';
import { RegenerateFeedbackAiSummaryUseCase } from '../use-cases/regenerate-feedback-ai-summary.usecase';

@Injectable()
export class FeedbackAiSummariesService {
  constructor(
    private readonly generateUseCase: GenerateFeedbackAiSummaryUseCase,
    private readonly regenerateUseCase: RegenerateFeedbackAiSummaryUseCase,
    private readonly findByIdUseCase: FindFeedbackAiSummaryByIdUseCase,
    private readonly findByApplicationIdUseCase: FindFeedbackAiSummaryByApplicationIdUseCase,
    private readonly listUseCase: ListFeedbackAiSummariesUseCase,
  ) {}

  generate(dto: GenerateFeedbackAiSummaryDto, actorUserId?: string): Promise<FeedbackAiSummaryEntity> {
    return this.generateUseCase.execute(dto, actorUserId);
  }

  regenerate(applicationId: string, actorUserId?: string): Promise<FeedbackAiSummaryEntity> {
    return this.regenerateUseCase.execute({ applicationId, actorUserId });
  }

  findById(id: string): Promise<FeedbackAiSummaryEntity> {
    return this.findByIdUseCase.execute(id);
  }

  findByApplicationId(applicationId: string): Promise<FeedbackAiSummaryEntity> {
    return this.findByApplicationIdUseCase.execute(applicationId);
  }

  list(query: ListFeedbackAiSummariesQueryDto): Promise<FeedbackAiSummaryListResult> {
    return this.listUseCase.execute(query);
  }
}
