import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewTranscriptEntity } from '../../entities/ai-interview-transcript.entity';
import { AiInterviewTranscriptRepository } from '../../repositories/ai-interview-transcript.repository';

@Injectable()
export class GetTranscriptEntryByIdUseCase {
  constructor(private readonly repository: AiInterviewTranscriptRepository) {}

  async execute(id: string): Promise<AiInterviewTranscriptEntity> {
    const transcriptEntry = await this.repository.findById(id);
    if (!transcriptEntry) {
      throw new NotFoundException({
        message: 'AI interview transcript entry not found',
        code: 'AI_INTERVIEW_TRANSCRIPT_NOT_FOUND',
      });
    }

    return transcriptEntry;
  }
}
