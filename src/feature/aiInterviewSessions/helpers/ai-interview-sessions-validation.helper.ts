import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { InterviewStatus } from '../../interviews/enums/interview-status.enum';

import { AiInterviewSessionStatus } from '../enums/ai-interview-session-status.enum';

@Injectable()
export class AiInterviewSessionsValidationHelper {
  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureInterviewIsSchedulable(status: InterviewStatus): void {
    const allowed = new Set<InterviewStatus>([
      InterviewStatus.SCHEDULED,
      InterviewStatus.RESCHEDULED,
    ]);

    if (!allowed.has(status)) {
      throw new ConflictException({
        message: 'AI interview session can only be created for a scheduled interview',
        code: 'INTERVIEW_NOT_SCHEDULED_FOR_AI_SESSION',
        meta: { interview_status: status },
      });
    }
  }

  ensureCanStart(current: AiInterviewSessionStatus): void {
    if (current !== AiInterviewSessionStatus.READY) {
      throw new ConflictException({
        message: 'AI interview session can only be started when READY',
        code: 'AI_SESSION_NOT_READY_TO_START',
        meta: { session_status: current },
      });
    }
  }

  ensureCanEnd(current: AiInterviewSessionStatus): void {
    if (current !== AiInterviewSessionStatus.IN_PROGRESS) {
      throw new ConflictException({
        message: 'AI interview session can only be ended when IN_PROGRESS',
        code: 'AI_SESSION_NOT_IN_PROGRESS_TO_END',
        meta: { session_status: current },
      });
    }
  }

  ensureCanCancel(current: AiInterviewSessionStatus): void {
    if (current === AiInterviewSessionStatus.COMPLETED) {
      throw new ConflictException({
        message: 'Completed AI interview session cannot be cancelled',
        code: 'AI_SESSION_ALREADY_COMPLETED',
        meta: { session_status: current },
      });
    }
  }

  ensureSessionStatusTransition(options: {
    from: AiInterviewSessionStatus;
    to: AiInterviewSessionStatus;
  }): void {
    const allowed: Record<AiInterviewSessionStatus, Set<AiInterviewSessionStatus>> = {
      [AiInterviewSessionStatus.PENDING]: new Set([
        AiInterviewSessionStatus.READY,
        AiInterviewSessionStatus.CANCELLED,
        AiInterviewSessionStatus.FAILED,
      ]),
      [AiInterviewSessionStatus.READY]: new Set([
        AiInterviewSessionStatus.IN_PROGRESS,
        AiInterviewSessionStatus.CANCELLED,
        AiInterviewSessionStatus.FAILED,
      ]),
      [AiInterviewSessionStatus.IN_PROGRESS]: new Set([
        AiInterviewSessionStatus.COMPLETED,
        AiInterviewSessionStatus.CANCELLED,
        AiInterviewSessionStatus.FAILED,
      ]),
      [AiInterviewSessionStatus.COMPLETED]: new Set([]),
      [AiInterviewSessionStatus.FAILED]: new Set([]),
      [AiInterviewSessionStatus.CANCELLED]: new Set([]),
    };

    if (!allowed[options.from].has(options.to)) {
      throw new ConflictException({
        message: 'Invalid AI interview session status transition',
        code: 'AI_SESSION_INVALID_STATUS_TRANSITION',
        meta: { from: options.from, to: options.to },
      });
    }
  }
}
