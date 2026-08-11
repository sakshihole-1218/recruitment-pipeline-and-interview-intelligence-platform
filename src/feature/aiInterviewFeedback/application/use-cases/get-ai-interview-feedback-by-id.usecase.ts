import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class GetAiInterviewFeedbackByIdUseCase {
  constructor(
    private readonly repository: AiInterviewFeedbackRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(id: string, actor?: AuthJwtPayload) {
    const feedback = await this.repository.findById(id);

    if (!feedback) {
      throw new NotFoundException({
        message: 'AI interview feedback not found',
        code: 'AI_INTERVIEW_FEEDBACK_NOT_FOUND',
      });
    }

    await this.interviewerAccessValidationHelper.assertCanAccessAiFeedback(
      actor,
      id,
    );

    return feedback;
  }
}
