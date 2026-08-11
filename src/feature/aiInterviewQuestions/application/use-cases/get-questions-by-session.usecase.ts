import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';
import { AiInterviewQuestionsReferenceRepository } from '../../repositories/ai-interview-questions-reference.repository';

@Injectable()
export class GetQuestionsBySessionUseCase {
  constructor(
    private readonly repository: AiInterviewQuestionRepository,
    private readonly referenceRepository: AiInterviewQuestionsReferenceRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(sessionId: string, actor?: AuthJwtPayload) {
    const session = await this.referenceRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException({
        message: 'AI interview session not found',
        code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
      });
    }

    await this.interviewerAccessValidationHelper.assertCanAccessAiSession(
      actor,
      sessionId,
    );

    return this.repository.findBySessionId(sessionId);
  }
}
