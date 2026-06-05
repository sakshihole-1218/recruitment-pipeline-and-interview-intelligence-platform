import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewSessionEntity } from '../../entities/ai-interview-session.entity';
import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';

@Injectable()
export class GetAiInterviewSessionByIdUseCase {
  constructor(private readonly repository: AiInterviewSessionRepository) {}

  async execute(id: string): Promise<AiInterviewSessionEntity> {
    const session = await this.repository.findById(id);

    if (!session) {
      throw new NotFoundException({
        message: 'AI interview session not found',
        code: 'AI_SESSION_NOT_FOUND',
      });
    }

    return session;
  }
}
