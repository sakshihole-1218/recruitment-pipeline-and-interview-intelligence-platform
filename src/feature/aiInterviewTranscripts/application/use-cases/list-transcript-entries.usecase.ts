import { Injectable } from '@nestjs/common';

import { TranscriptQueryDto } from '../../dto/transcript-query.dto';
import { AiInterviewTranscriptsValidationHelper } from '../../helpers/ai-interview-transcripts-validation.helper';
import {
  AiInterviewTranscriptListResult,
  AiInterviewTranscriptRepository,
} from '../../repositories/ai-interview-transcript.repository';

@Injectable()
export class ListTranscriptEntriesUseCase {
  constructor(
    private readonly repository: AiInterviewTranscriptRepository,
    private readonly validation: AiInterviewTranscriptsValidationHelper,
  ) {}

  async execute(query: TranscriptQueryDto): Promise<AiInterviewTranscriptListResult> {
    this.validation.ensureSpokenRangeValid(query.spoken_from, query.spoken_to);
    return this.repository.findAllWithFilters(query);
  }
}
