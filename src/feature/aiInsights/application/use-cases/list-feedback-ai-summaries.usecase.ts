import { Injectable } from '@nestjs/common';

import { ListFeedbackAiSummariesQueryDto } from '../../dto/list-feedback-ai-summaries.query.dto';
import {
  FeedbackAiSummaryListResult,
  FeedbackAiSummaryRepository,
} from '../../repositories/feedback-ai-summary.repository';

@Injectable()
export class ListFeedbackAiSummariesUseCase {
  constructor(
    private readonly feedbackAiSummaryRepository: FeedbackAiSummaryRepository,
  ) {}

  async execute(
    query: ListFeedbackAiSummariesQueryDto,
  ): Promise<FeedbackAiSummaryListResult> {
    return this.feedbackAiSummaryRepository.list(query);
  }
}
