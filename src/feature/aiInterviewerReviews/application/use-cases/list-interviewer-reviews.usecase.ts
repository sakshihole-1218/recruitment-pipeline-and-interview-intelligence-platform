import { Injectable } from '@nestjs/common';

import { InterviewerReviewQueryDto } from '../../dto/interviewer-review.query.dto';
import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class ListInterviewerReviewsUseCase {
  constructor(private readonly repository: InterviewerReviewRepository) {}

  execute(query: InterviewerReviewQueryDto) {
    return this.repository.findAllWithFilters(query);
  }
}
