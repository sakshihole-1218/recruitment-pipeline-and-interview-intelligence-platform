import { Injectable, NotFoundException } from '@nestjs/common';

import { FeedbackAiSummaryEntity } from '../../entities/feedback-ai-summary.entity';
import { FeedbackAiSummaryRepository } from '../../repositories/feedback-ai-summary.repository';

@Injectable()
export class FindFeedbackAiSummaryByApplicationIdUseCase {
  constructor(
    private readonly feedbackAiSummaryRepository: FeedbackAiSummaryRepository,
  ) {}

  async execute(applicationId: string): Promise<FeedbackAiSummaryEntity> {
    const row = await this.feedbackAiSummaryRepository.findActiveByApplicationId(
      applicationId,
    );

    if (!row) {
      throw new NotFoundException({
        message: 'Feedback AI summary not found for this application',
        code: 'FEEDBACK_AI_SUMMARY_NOT_FOUND',
      });
    }

    return row;
  }
}
