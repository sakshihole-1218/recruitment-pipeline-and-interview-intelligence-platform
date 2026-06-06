import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class GetFeedbackBySessionUseCase {
  constructor(private readonly repository: AiInterviewFeedbackRepository) {}

  async execute(sessionId: string) {
    const feedback = await this.repository.findBySessionId(sessionId);

    if (!feedback) {
      throw new NotFoundException({
        message: 'AI interview feedback not found for this session',
        code: 'AI_INTERVIEW_FEEDBACK_NOT_FOUND',
      });
    }

    return feedback;
  }
}