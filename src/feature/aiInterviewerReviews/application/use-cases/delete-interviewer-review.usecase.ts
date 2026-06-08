import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { InterviewerReviewsValidationHelper } from '../../helpers/interviewer-reviews-validation.helper';
import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class DeleteInterviewerReviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: InterviewerReviewRepository,
    private readonly validation: InterviewerReviewsValidationHelper,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    this.validation.ensureActorUserRequired(actorUserId);

    await this.dataSource.transaction(async (manager) => {
      const review = await this.repository.findById(id, {
        manager,
        lockForUpdate: true,
      });

      if (!review) {
        throw new NotFoundException({
          message: 'Interviewer review not found',
          code: 'INTERVIEWER_REVIEW_NOT_FOUND',
        });
      }

      await this.repository.softDeleteReview(id, {
        actorUserId,
        manager,
      });
    });
  }
}
