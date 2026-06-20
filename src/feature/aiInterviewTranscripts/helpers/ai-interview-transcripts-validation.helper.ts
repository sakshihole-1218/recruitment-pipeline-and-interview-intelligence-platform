import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { AiInterviewSessionStatus } from '../../aiInterviewSessions/enums/ai-interview-session-status.enum';
import { AiInterviewQuestionEntity } from '../../aiInterviewQuestions/entities/ai-interview-question.entity';

@Injectable()
export class AiInterviewTranscriptsValidationHelper {
  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureSessionAllowsCreate(status: AiInterviewSessionStatus): void {
    if (status !== AiInterviewSessionStatus.IN_PROGRESS) {
      throw new ConflictException({
        message:
          'Transcript entries can only be created for IN_PROGRESS sessions',
        code: 'AI_INTERVIEW_SESSION_NOT_IN_PROGRESS',
        meta: { session_status: status },
      });
    }
  }

  ensureSessionAllowsBulkCreate(status: AiInterviewSessionStatus): void {
    const allowed = new Set<AiInterviewSessionStatus>([
      AiInterviewSessionStatus.IN_PROGRESS,
      AiInterviewSessionStatus.COMPLETED,
    ]);

    if (!allowed.has(status)) {
      throw new ConflictException({
        message:
          'Bulk transcript import is only allowed for IN_PROGRESS or COMPLETED sessions',
        code: 'AI_INTERVIEW_SESSION_INVALID_FOR_BULK_TRANSCRIPTS',
        meta: { session_status: status },
      });
    }
  }

  ensureQuestionBelongsToSession(
    question: AiInterviewQuestionEntity,
    sessionId: string,
  ): void {
    if (question.ai_interview_session_id !== sessionId) {
      throw new BadRequestException({
        message:
          'AI interview question must belong to the same AI interview session',
        code: 'AI_INTERVIEW_QUESTION_SESSION_MISMATCH',
      });
    }
  }

  ensureAudioFileProvided(
    file: Express.Multer.File | undefined,
  ): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException({
        message: 'Audio file is required',
        code: 'AI_INTERVIEW_AUDIO_FILE_REQUIRED',
      });
    }
  }

  ensureAudioFileType(file: Express.Multer.File): void {
    const mimeType = String(file.mimetype ?? '').toLowerCase();

    if (!mimeType.startsWith('audio/')) {
      throw new BadRequestException({
        message:
          'Only audio uploads are supported for AI interview transcription',
        code: 'AI_INTERVIEW_AUDIO_FILE_INVALID_TYPE',
        meta: { mime_type: file.mimetype },
      });
    }
  }

  ensureSequenceNumberAvailable(sequenceNumber: number, exists: boolean): void {
    if (exists) {
      throw new ConflictException({
        message: 'Sequence number already exists in this AI interview session',
        code: 'TRANSCRIPT_SEQUENCE_NUMBER_CONFLICT',
        meta: { sequence_number: sequenceNumber },
      });
    }
  }

  ensureBulkEntriesProvided(count: number): void {
    if (count < 1) {
      throw new BadRequestException({
        message: 'At least one transcript entry is required',
        code: 'TRANSCRIPT_BULK_ENTRIES_REQUIRED',
      });
    }
  }

  ensureSpokenRangeValid(spokenFrom?: string, spokenTo?: string): void {
    if (!spokenFrom || !spokenTo) {
      return;
    }

    const from = new Date(spokenFrom);
    const to = new Date(spokenTo);

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException({
        message: 'spoken_from cannot be later than spoken_to',
        code: 'TRANSCRIPT_INVALID_SPOKEN_RANGE',
      });
    }
  }
}
