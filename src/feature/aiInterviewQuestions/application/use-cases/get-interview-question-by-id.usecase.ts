import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';

@Injectable()
export class GetInterviewQuestionByIdUseCase {
  constructor(
    private readonly repository: AiInterviewQuestionRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(id: string, actor?: AuthJwtPayload) {
    const question = await this.repository.findById(id);

    if (!question) {
      throw new NotFoundException({
        message: 'AI interview question not found',
        code: 'AI_INTERVIEW_QUESTION_NOT_FOUND',
      });
    }

    await this.interviewerAccessValidationHelper.assertCanAccessAiQuestion(
      actor,
      id,
    );

    return question;
  }
}
