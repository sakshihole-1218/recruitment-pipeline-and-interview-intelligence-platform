import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class GetFeedbackBySessionUseCase {
  constructor(
    private readonly repository: AiInterviewFeedbackRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(sessionId: string, actor?: AuthJwtPayload) {
    const feedback = await this.repository.findBySessionId(sessionId);

    if (!feedback) {
      throw new NotFoundException({
        message: 'AI interview feedback not found for this session',
        code: 'AI_INTERVIEW_FEEDBACK_NOT_FOUND',
      });
    }

    await this.interviewerAccessValidationHelper.assertCanAccessAiSession(
      actor,
      sessionId,
    );

    return feedback;
  }
}
