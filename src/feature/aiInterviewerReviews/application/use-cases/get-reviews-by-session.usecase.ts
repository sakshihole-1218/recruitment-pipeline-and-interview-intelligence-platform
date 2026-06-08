import { Injectable } from '@nestjs/common';

import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class GetReviewsBySessionUseCase {
  constructor(private readonly repository: InterviewerReviewRepository) {}

  execute(sessionId: string) {
    return this.repository.findBySessionId(sessionId);
  }
}
