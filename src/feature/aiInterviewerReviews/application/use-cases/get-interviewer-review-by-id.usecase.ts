import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { InterviewerReviewsValidationHelper } from '../../helpers/interviewer-reviews-validation.helper';
import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class GetInterviewerReviewByIdUseCase {
  constructor(
    private readonly repository: InterviewerReviewRepository,
    private readonly validation: InterviewerReviewsValidationHelper,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(id: string, actor?: AuthJwtPayload) {
    await this.interviewerAccessValidationHelper.assertCanAccessInterviewerReview(
      actor,
      id,
    );
    const review = await this.repository.findById(id);

    if (!review) {
      throw new NotFoundException({
        message: 'Interviewer review not found',
        code: 'INTERVIEWER_REVIEW_NOT_FOUND',
      });
    }

    this.validation.ensureInterviewerOwnsReview(
      this.interviewerAccessValidationHelper.isInterviewerOnly(actor),
      actor?.sub ?? '',
      review,
    );

    return review;
  }
}
