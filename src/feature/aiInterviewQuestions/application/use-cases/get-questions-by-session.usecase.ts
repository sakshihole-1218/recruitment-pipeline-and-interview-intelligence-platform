import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';
import { AiInterviewQuestionsReferenceRepository } from '../../repositories/ai-interview-questions-reference.repository';

@Injectable()
export class GetQuestionsBySessionUseCase {
  constructor(
    private readonly repository: AiInterviewQuestionRepository,
    private readonly referenceRepository: AiInterviewQuestionsReferenceRepository,
  ) {}

  async execute(sessionId: string) {
    const session = await this.referenceRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException({
        message: 'AI interview session not found',
        code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
      });
    }

    return this.repository.findBySessionId(sessionId);
  }
}
