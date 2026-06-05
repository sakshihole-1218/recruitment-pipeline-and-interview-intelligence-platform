import { Injectable } from '@nestjs/common';

import { AiInterviewSessionEntity } from '../../entities/ai-interview-session.entity';
import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';

@Injectable()
export class GetAiInterviewSessionByInterviewIdUseCase {
  constructor(private readonly repository: AiInterviewSessionRepository) {}

  async execute(interviewId: string): Promise<AiInterviewSessionEntity[]> {
    return this.repository.findByInterviewId(interviewId);
  }
}
