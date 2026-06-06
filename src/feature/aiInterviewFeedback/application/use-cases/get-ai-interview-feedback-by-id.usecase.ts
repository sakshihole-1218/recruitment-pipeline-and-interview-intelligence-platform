import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class GetAiInterviewFeedbackByIdUseCase {
  constructor(private readonly repository: AiInterviewFeedbackRepository) {}

  async execute(id: string) {
    const feedback = await this.repository.findById(id);

    if (!feedback) {
      throw new NotFoundException({
        message: 'AI interview feedback not found',
        code: 'AI_INTERVIEW_FEEDBACK_NOT_FOUND',
      });
    }

    return feedback;
  }
}