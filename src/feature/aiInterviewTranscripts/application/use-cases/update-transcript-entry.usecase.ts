import { Injectable, NotFoundException } from '@nestjs/common';

import { UpdateTranscriptEntryDto } from '../../dto/update-transcript-entry.dto';
import { AiInterviewTranscriptEntity } from '../../entities/ai-interview-transcript.entity';
import { AiInterviewTranscriptsValidationHelper } from '../../helpers/ai-interview-transcripts-validation.helper';
import { AiInterviewTranscriptRepository } from '../../repositories/ai-interview-transcript.repository';

@Injectable()
export class UpdateTranscriptEntryUseCase {
  constructor(
    private readonly repository: AiInterviewTranscriptRepository,
    private readonly validation: AiInterviewTranscriptsValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: UpdateTranscriptEntryDto,
    actorUserId?: string,
  ): Promise<AiInterviewTranscriptEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

    const transcriptEntry = await this.repository.findById(id, {
      lockForUpdate: false,
    });

    if (!transcriptEntry) {
      throw new NotFoundException({
        message: 'AI interview transcript entry not found',
        code: 'AI_INTERVIEW_TRANSCRIPT_NOT_FOUND',
      });
    }

    if (dto.message_text !== undefined) {
      transcriptEntry.message_text = dto.message_text.trim();
    }

    if (dto.spoken_at !== undefined) {
      transcriptEntry.spoken_at = dto.spoken_at;
    }

    if (dto.speech_to_text_confidence !== undefined) {
      transcriptEntry.speech_to_text_confidence = dto.speech_to_text_confidence;
    }

    if (dto.raw_payload !== undefined) {
      transcriptEntry.raw_payload = dto.raw_payload;
    }

    transcriptEntry.updated_by_user_id = actorUserId;

    return this.repository.updateEntry(transcriptEntry);
  }
}
