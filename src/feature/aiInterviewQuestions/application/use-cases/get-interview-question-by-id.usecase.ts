import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';

@Injectable()
export class GetInterviewQuestionByIdUseCase {
  constructor(private readonly repository: AiInterviewQuestionRepository) {}

  async execute(id: string) {
    const question = await this.repository.findById(id);

    if (!question) {
      throw new NotFoundException({
        message: 'AI interview question not found',
        code: 'AI_INTERVIEW_QUESTION_NOT_FOUND',
      });
    }

    return question;
  }
}
