import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { AiInterviewTranscriptEntity } from '../../entities/ai-interview-transcript.entity';
import { AiInterviewTranscriptRepository } from '../../repositories/ai-interview-transcript.repository';

@Injectable()
export class GetTranscriptEntryByIdUseCase {
  constructor(
    private readonly repository: AiInterviewTranscriptRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(id: string, actor?: AuthJwtPayload): Promise<AiInterviewTranscriptEntity> {
    const transcriptEntry = await this.repository.findById(id);
    if (!transcriptEntry) {
      throw new NotFoundException({
        message: 'AI interview transcript entry not found',
        code: 'AI_INTERVIEW_TRANSCRIPT_NOT_FOUND',
      });
    }

    await this.interviewerAccessValidationHelper.assertCanAccessAiTranscript(
      actor,
      id,
    );

    return transcriptEntry;
  }
}
