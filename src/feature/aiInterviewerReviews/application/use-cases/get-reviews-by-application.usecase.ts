import { Injectable } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class GetReviewsByApplicationUseCase {
  constructor(
    private readonly repository: InterviewerReviewRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(applicationId: string, actor?: AuthJwtPayload) {
    await this.interviewerAccessValidationHelper.assertCanAccessApplication(
      actor,
      applicationId,
    );

    const reviews = await this.repository.findByApplicationId(applicationId);
    if (!this.interviewerAccessValidationHelper.isInterviewerOnly(actor)) {
      return reviews;
    }

    return reviews.filter((review) => review.reviewer_user_id === actor?.sub);
  }
}
