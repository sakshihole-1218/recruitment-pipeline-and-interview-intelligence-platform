import { Injectable } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class GetReviewsBySessionUseCase {
  constructor(
    private readonly repository: InterviewerReviewRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(sessionId: string, actor?: AuthJwtPayload) {
    await this.interviewerAccessValidationHelper.assertCanAccessAiSession(
      actor,
      sessionId,
    );

    const reviews = await this.repository.findBySessionId(sessionId);
    if (!this.interviewerAccessValidationHelper.isInterviewerOnly(actor)) {
      return reviews;
    }

    return reviews.filter((review) => review.reviewer_user_id === actor?.sub);
  }
}
