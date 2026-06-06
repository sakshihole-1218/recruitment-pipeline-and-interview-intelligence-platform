import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewQuestionsValidationHelper } from '../../helpers/ai-interview-questions-validation.helper';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';

@Injectable()
export class DeleteInterviewQuestionUseCase {
  constructor(
    private readonly repository: AiInterviewQuestionRepository,
    private readonly validation: AiInterviewQuestionsValidationHelper,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    this.validation.ensureActorUserRequired(actorUserId);

    const question = await this.repository.findById(id);
    if (!question) {
      throw new NotFoundException({
        message: 'AI interview question not found',
        code: 'AI_INTERVIEW_QUESTION_NOT_FOUND',
      });
    }

    await this.repository.softDeleteQuestion(id, { actorUserId });
  }
}
