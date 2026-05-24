import { Injectable, NotFoundException } from '@nestjs/common';

import { FeedbackAiSummaryEntity } from '../../entities/feedback-ai-summary.entity';
import { FeedbackAiSummaryRepository } from '../../repositories/feedback-ai-summary.repository';

@Injectable()
export class FindFeedbackAiSummaryByIdUseCase {
  constructor(
    private readonly feedbackAiSummaryRepository: FeedbackAiSummaryRepository,
  ) {}

  async execute(id: string): Promise<FeedbackAiSummaryEntity> {
    const row = await this.feedbackAiSummaryRepository.findById(id);
    if (!row) {
      throw new NotFoundException({
        message: 'Feedback AI summary not found',
        code: 'FEEDBACK_AI_SUMMARY_NOT_FOUND',
      });
    }
    return row;
  }
}
