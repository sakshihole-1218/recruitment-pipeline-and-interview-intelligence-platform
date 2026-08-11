import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { AiInterviewSessionStatus } from '../../aiInterviewSessions/enums/ai-interview-session-status.enum';
import { QuestionGenerationStatus } from '../../aiInterviewSessions/enums/question-generation-status.enum';

import { AiInterviewQuestionEntity } from '../entities/ai-interview-question.entity';
import { QuestionSource } from '../enums/question-source.enum';
import { QuestionStatus } from '../enums/question-status.enum';
import { QuestionType } from '../enums/question-type.enum';

@Injectable()
export class AiInterviewQuestionsValidationHelper {
  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      return;
    }

    if (typeof actorUserId !== 'string') {
      throw new BadRequestException({
        message: 'Actor user is invalid',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureSessionSupportsQuestionGeneration(
    status: AiInterviewSessionStatus,
  ): void {
    const allowed = new Set<AiInterviewSessionStatus>([
      AiInterviewSessionStatus.READY,
      AiInterviewSessionStatus.IN_PROGRESS,
    ]);

    if (!allowed.has(status)) {
      throw new ConflictException({
        message:
          'Interview plan can only be generated for READY or IN_PROGRESS sessions',
        code: 'AI_INTERVIEW_SESSION_INVALID_FOR_PLAN_GENERATION',
        meta: { session_status: status },
      });
    }
  }

  ensurePlanGenerationNotCompleted(status: QuestionGenerationStatus): void {
    if (status === QuestionGenerationStatus.COMPLETED) {
      throw new ConflictException({
        message: 'Interview plan has already been generated for this session',
        code: 'AI_INTERVIEW_PLAN_ALREADY_GENERATED',
      });
    }
  }

  ensureFollowUpConsistency(
    questionType: QuestionType,
    parentQuestionId?: string | null,
    questionSource?: QuestionSource,
  ): void {
    const isFollowUp =
      questionType === QuestionType.FOLLOW_UP ||
      questionSource === QuestionSource.FOLLOW_UP;

    if (isFollowUp && !parentQuestionId) {
      throw new BadRequestException({
        message: 'Follow-up questions require parent_question_id',
        code: 'FOLLOW_UP_PARENT_REQUIRED',
      });
    }

    if (!isFollowUp && parentQuestionId) {
      throw new BadRequestException({
        message: 'Only FOLLOW_UP questions can reference parent_question_id',
        code: 'FOLLOW_UP_PARENT_INVALID_FOR_QUESTION_TYPE',
      });
    }
  }

  ensureParentQuestionBelongsToSession(
    parentQuestion: AiInterviewQuestionEntity,
    sessionId: string,
  ): void {
    if (parentQuestion.ai_interview_session_id !== sessionId) {
      throw new BadRequestException({
        message: 'Parent question must belong to the same AI interview session',
        code: 'PARENT_QUESTION_SESSION_MISMATCH',
      });
    }
  }

  ensureSequenceNumberAvailable(
    sequenceNumber: number,
    existing: number[],
  ): void {
    if (existing.includes(sequenceNumber)) {
      throw new ConflictException({
        message: 'Sequence number already exists in this AI interview session',
        code: 'QUESTION_SEQUENCE_NUMBER_CONFLICT',
        meta: { sequence_number: sequenceNumber },
      });
    }
  }

  ensureAnsweredAfterAsked(
    askedAt: Date | null,
    answeredAt: Date | null,
  ): void {
    if (askedAt && answeredAt && answeredAt.getTime() < askedAt.getTime()) {
      throw new BadRequestException({
        message: 'answered_at cannot be before asked_at',
        code: 'QUESTION_INVALID_ANSWERED_AT',
      });
    }
  }

  ensureQuestionStatusConsistency(
    status: QuestionStatus,
    askedAt: Date | null,
    answeredAt: Date | null,
  ): void {
    if (status === QuestionStatus.PENDING && (askedAt || answeredAt)) {
      throw new BadRequestException({
        message: 'Pending questions cannot have asked_at or answered_at set',
        code: 'QUESTION_STATUS_PENDING_INVALID_TIMESTAMPS',
      });
    }

    if (status === QuestionStatus.ASKED && !askedAt) {
      throw new BadRequestException({
        message: 'Asked questions require asked_at',
        code: 'QUESTION_STATUS_ASKED_TIMESTAMP_REQUIRED',
      });
    }

    if (status === QuestionStatus.ANSWERED && (!askedAt || !answeredAt)) {
      throw new BadRequestException({
        message: 'Answered questions require asked_at and answered_at',
        code: 'QUESTION_STATUS_ANSWERED_TIMESTAMPS_REQUIRED',
      });
    }
  }

  ensureTranscriptHasContent(candidateAnswer: string): void {
    const normalized = candidateAnswer.trim();
    if (!normalized) {
      throw new BadRequestException({
        message: 'Candidate answer transcript is empty',
        code: 'AI_INTERVIEW_TRANSCRIPT_EMPTY',
      });
    }

    const wordCount = normalized.split(/\s+/).filter(Boolean).length;
    if (wordCount < 4 || normalized.length < 20) {
      throw new BadRequestException({
        message:
          'Candidate answer transcript is too short for follow-up generation',
        code: 'AI_INTERVIEW_TRANSCRIPT_TOO_SHORT',
      });
    }
  }

  ensureFollowUpLimitNotReached(count: number): void {
    if (count >= 2) {
      throw new ConflictException({
        message:
          'Maximum follow-up question limit reached for this main question',
        code: 'AI_INTERVIEW_FOLLOW_UP_LIMIT_REACHED',
      });
    }
  }

  ensureNoDuplicateFollowUp(
    generatedQuestion: string,
    existingQuestions: string[],
  ): void {
    const normalized = this.normalizeQuestionText(generatedQuestion);
    if (!normalized) {
      throw new BadRequestException({
        message: 'Generated follow-up question is empty',
        code: 'AI_INTERVIEW_FOLLOW_UP_EMPTY',
      });
    }

    const isDuplicate = existingQuestions.some(
      (question) => this.normalizeQuestionText(question) === normalized,
    );

    if (isDuplicate) {
      throw new ConflictException({
        message: 'Generated follow-up question duplicates an existing question',
        code: 'AI_INTERVIEW_DUPLICATE_FOLLOW_UP',
      });
    }
  }

  private normalizeQuestionText(value: string): string {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }
}
