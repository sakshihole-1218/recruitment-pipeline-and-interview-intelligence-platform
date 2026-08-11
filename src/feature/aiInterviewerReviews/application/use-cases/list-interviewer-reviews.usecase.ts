import { Injectable } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { InterviewerReviewQueryDto } from '../../dto/interviewer-review.query.dto';
import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class ListInterviewerReviewsUseCase {
  constructor(
    private readonly repository: InterviewerReviewRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(query: InterviewerReviewQueryDto, actor?: AuthJwtPayload) {
    if (query.ai_interview_session_id) {
      await this.interviewerAccessValidationHelper.assertCanAccessAiSession(
        actor,
        query.ai_interview_session_id,
      );
    }

    if (query.application_id) {
      await this.interviewerAccessValidationHelper.assertCanAccessApplication(
        actor,
        query.application_id,
      );
    }

    const normalizedQuery = { ...query };
    if (this.interviewerAccessValidationHelper.isInterviewerOnly(actor)) {
      normalizedQuery.reviewer_user_id = actor?.sub;
    }

    return this.repository.findAllWithFilters(normalizedQuery);
  }
}
