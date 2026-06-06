import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AiInterviewSessionStatus } from '../../aiInterviewSessions/enums/ai-interview-session-status.enum';

import { InterviewProctoringEventEntity } from '../entities/interview-proctoring-event.entity';

@Injectable()
export class InterviewProctoringEventsValidationHelper {
  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureSessionExists(sessionId: string, exists: boolean): void {
    if (!exists) {
      throw new NotFoundException({
        message: 'AI interview session not found',
        code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
        meta: { ai_interview_session_id: sessionId },
      });
    }
  }

  ensureSessionAllowsProctoringEvent(status: AiInterviewSessionStatus): void {
    if (
      status !== AiInterviewSessionStatus.IN_PROGRESS &&
      status !== AiInterviewSessionStatus.COMPLETED
    ) {
      throw new ConflictException({
        message:
          'Proctoring events can only be stored for AI interview sessions that are IN_PROGRESS or COMPLETED',
        code: 'AI_INTERVIEW_SESSION_INVALID_STATUS',
        meta: { session_status: status },
      });
    }
  }

  ensureEventExists(
    event: InterviewProctoringEventEntity | null,
    eventId: string,
  ): asserts event is InterviewProctoringEventEntity {
    if (!event) {
      throw new NotFoundException({
        message: 'Interview proctoring event not found',
        code: 'INTERVIEW_PROCTORING_EVENT_NOT_FOUND',
        meta: { id: eventId },
      });
    }
  }

  ensureEventNotAlreadyResolved(event: InterviewProctoringEventEntity): void {
    if (event.is_resolved) {
      throw new ConflictException({
        message: 'Interview proctoring event is already resolved',
        code: 'INTERVIEW_PROCTORING_EVENT_ALREADY_RESOLVED',
        meta: { id: event.id },
      });
    }
  }

  ensureBulkEventsProvided(count: number): void {
    if (!count) {
      throw new BadRequestException({
        message: 'At least one proctoring event is required',
        code: 'PROCTORING_EVENTS_REQUIRED',
      });
    }
  }

  ensureDurationValid(durationSeconds?: number | null): void {
    if (durationSeconds === null || durationSeconds === undefined) {
      return;
    }

    if (!Number.isInteger(durationSeconds) || durationSeconds < 0) {
      throw new BadRequestException({
        message: 'duration_seconds must be a non-negative integer',
        code: 'INVALID_DURATION_SECONDS',
      });
    }
  }
}
