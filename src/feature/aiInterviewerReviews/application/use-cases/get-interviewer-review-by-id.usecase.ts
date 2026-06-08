import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class GetInterviewerReviewByIdUseCase {
  constructor(private readonly repository: InterviewerReviewRepository) {}

  async execute(id: string) {
    const review = await this.repository.findById(id);

    if (!review) {
      throw new NotFoundException({
        message: 'Interviewer review not found',
        code: 'INTERVIEWER_REVIEW_NOT_FOUND',
      });
    }

    return review;
  }
}
