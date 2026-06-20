import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { AiInterviewTranscriptEntity } from '../../aiInterviewTranscripts/entities/ai-interview-transcript.entity';
import { TranscriptSpeakerType } from '../../aiInterviewTranscripts/enums/transcript-speaker-type.enum';
import { AiInterviewSessionStatus } from '../../aiInterviewSessions/enums/ai-interview-session-status.enum';

import { AiInterviewFeedbackEntity } from '../entities/ai-interview-feedback.entity';
import { AiInterviewFeedbackStatus } from '../enums/ai-interview-feedback-status.enum';
import { AiInterviewRecommendation } from '../enums/ai-interview-recommendation.enum';

@Injectable()
export class AiInterviewFeedbackValidationHelper {
  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureSessionCompleted(status: AiInterviewSessionStatus): void {
    if (status !== AiInterviewSessionStatus.COMPLETED) {
      throw new ConflictException({
        message:
          'AI interview feedback can only be generated for a completed AI interview session',
        code: 'AI_INTERVIEW_SESSION_NOT_COMPLETED',
        meta: { session_status: status },
      });
    }
  }

  ensureTranscriptExists(entries: AiInterviewTranscriptEntity[]): void {
    if (!entries.length) {
      throw new BadRequestException({
        message:
          'AI interview transcript must exist before generating feedback',
        code: 'AI_INTERVIEW_TRANSCRIPT_REQUIRED',
      });
    }
  }

  ensureCandidateTranscriptExists(
    entries: AiInterviewTranscriptEntity[],
  ): void {
    const exists = entries.some(
      (entry) => entry.speaker_type === TranscriptSpeakerType.CANDIDATE,
    );

    if (!exists) {
      throw new BadRequestException({
        message:
          'At least one candidate transcript entry is required before generating feedback',
        code: 'CANDIDATE_TRANSCRIPT_REQUIRED',
      });
    }
  }

  ensureNoDuplicateActiveFeedback(
    existing: AiInterviewFeedbackEntity | null,
  ): void {
    if (existing) {
      throw new ConflictException({
        message: 'Active AI interview feedback already exists for this session',
        code: 'AI_INTERVIEW_FEEDBACK_ALREADY_EXISTS',
      });
    }
  }

  ensureScoreWithinRange(
    score: number | null | undefined,
    fieldName: string,
  ): void {
    if (score === null || score === undefined) {
      return;
    }

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new BadRequestException({
        message: `${fieldName} must be between 0 and 100`,
        code: 'INVALID_SCORE_RANGE',
        meta: { field: fieldName, value: score },
      });
    }
  }

  ensureStatusFailureReasonConsistency(
    status: AiInterviewFeedbackStatus,
    failureReason?: string | null,
  ): void {
    if (
      status === AiInterviewFeedbackStatus.FAILED &&
      !String(failureReason || '').trim()
    ) {
      throw new BadRequestException({
        message: 'failure_reason is required when feedback_status is FAILED',
        code: 'FAILURE_REASON_REQUIRED',
      });
    }
  }

  calculateOverallScore(
    scores: Array<number | null | undefined>,
  ): number | null {
    const validScores = scores.filter(
      (score): score is number =>
        score !== null && score !== undefined && Number.isFinite(score),
    );

    if (!validScores.length) {
      return null;
    }

    const total = validScores.reduce((sum, score) => sum + score, 0);
    return Number((total / validScores.length).toFixed(2));
  }

  toRecommendation(
    score: number | null | undefined,
  ): AiInterviewRecommendation | null {
    if (score === null || score === undefined || !Number.isFinite(score)) {
      return null;
    }

    if (score <= 39) {
      return AiInterviewRecommendation.STRONGLY_REJECT;
    }

    if (score <= 54) {
      return AiInterviewRecommendation.REJECT;
    }

    if (score <= 69) {
      return AiInterviewRecommendation.HOLD;
    }

    if (score <= 84) {
      return AiInterviewRecommendation.SELECT;
    }

    return AiInterviewRecommendation.STRONGLY_SELECT;
  }

  normalizeText(value: string | null | undefined): string | null {
    const normalized = String(value || '').trim();
    return normalized ? normalized : null;
  }
}
