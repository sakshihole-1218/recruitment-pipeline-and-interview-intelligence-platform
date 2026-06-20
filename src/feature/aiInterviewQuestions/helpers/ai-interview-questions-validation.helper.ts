import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { AiInterviewSessionStatus } from '../../aiInterviewSessions/enums/ai-interview-session-status.enum';
import { QuestionGenerationStatus } from '../../aiInterviewSessions/enums/question-generation-status.enum';

import { AiInterviewQuestionEntity } from '../entities/ai-interview-question.entity';
import { QuestionType } from '../enums/question-type.enum';

@Injectable()
export class AiInterviewQuestionsValidationHelper {
  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
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
  ): void {
    if (questionType === QuestionType.FOLLOW_UP && !parentQuestionId) {
      throw new BadRequestException({
        message: 'Follow-up questions require parent_question_id',
        code: 'FOLLOW_UP_PARENT_REQUIRED',
      });
    }

    if (questionType !== QuestionType.FOLLOW_UP && parentQuestionId) {
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
}
