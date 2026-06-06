import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewTranscriptsValidationHelper } from '../../helpers/ai-interview-transcripts-validation.helper';
import { AiInterviewTranscriptRepository } from '../../repositories/ai-interview-transcript.repository';

@Injectable()
export class DeleteTranscriptEntryUseCase {
  constructor(
    private readonly repository: AiInterviewTranscriptRepository,
    private readonly validation: AiInterviewTranscriptsValidationHelper,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    this.validation.ensureActorUserRequired(actorUserId);

    const transcriptEntry = await this.repository.findById(id);
    if (!transcriptEntry) {
      throw new NotFoundException({
        message: 'AI interview transcript entry not found',
        code: 'AI_INTERVIEW_TRANSCRIPT_NOT_FOUND',
      });
    }

    await this.repository.softDeleteEntry(id, { actorUserId });
  }
}
