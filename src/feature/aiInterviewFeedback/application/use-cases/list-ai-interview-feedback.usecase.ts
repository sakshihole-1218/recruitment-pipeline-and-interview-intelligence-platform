import { Injectable } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { AiInterviewFeedbackQueryDto } from '../../dto/ai-interview-feedback.query.dto';
import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class ListAiInterviewFeedbackUseCase {
  constructor(
    private readonly repository: AiInterviewFeedbackRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(query: AiInterviewFeedbackQueryDto, actor?: AuthJwtPayload) {
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

    if (query.candidate_id) {
      await this.interviewerAccessValidationHelper.assertCanAccessCandidate(
        actor,
        query.candidate_id,
      );
    }

    return this.repository.findAllWithFilters(query, {
      interviewerUserId: this.interviewerAccessValidationHelper.isInterviewerOnly(
        actor,
      )
        ? actor?.sub
        : undefined,
    });
  }
}
