import { Injectable } from '@nestjs/common';

import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class GetReviewsByApplicationUseCase {
  constructor(private readonly repository: InterviewerReviewRepository) {}

  execute(applicationId: string) {
    return this.repository.findByApplicationId(applicationId);
  }
}
