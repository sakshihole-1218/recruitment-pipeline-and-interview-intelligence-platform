import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewTranscriptEntity } from '../../entities/ai-interview-transcript.entity';
import { AiInterviewTranscriptRepository } from '../../repositories/ai-interview-transcript.repository';
import { AiInterviewTranscriptsReferenceRepository } from '../../repositories/ai-interview-transcripts-reference.repository';

@Injectable()
export class GetTranscriptBySessionUseCase {
  constructor(
    private readonly repository: AiInterviewTranscriptRepository,
    private readonly referenceRepository: AiInterviewTranscriptsReferenceRepository,
  ) {}

  async execute(sessionId: string): Promise<AiInterviewTranscriptEntity[]> {
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
