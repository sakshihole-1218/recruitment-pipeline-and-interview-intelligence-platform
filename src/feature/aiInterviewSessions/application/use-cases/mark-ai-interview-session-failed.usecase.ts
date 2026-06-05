import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AiInterviewSessionEntity } from '../../entities/ai-interview-session.entity';
import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';
import { AiInterviewSessionsValidationHelper } from '../../helpers/ai-interview-sessions-validation.helper';
import { AiInterviewSessionStatus } from '../../enums/ai-interview-session-status.enum';

@Injectable()
export class MarkAiInterviewSessionFailedUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewSessionRepository,
    private readonly validation: AiInterviewSessionsValidationHelper,
  ) {}

  async execute(
    id: string,
    options: { actorUserId?: string; reason: string },
  ): Promise<AiInterviewSessionEntity> {
    this.validation.ensureActorUserRequired(options.actorUserId);

    if (!options.reason || !String(options.reason).trim()) {
      throw new BadRequestException({
        message: 'failure_reason is required',
        code: 'FAILURE_REASON_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();

      const session = await this.repository.findById(id, {
        manager,
        lockForUpdate: true,
      });

      if (!session) {
        throw new NotFoundException({
          message: 'AI interview session not found',
          code: 'AI_SESSION_NOT_FOUND',
        });
      }

      session.session_status = AiInterviewSessionStatus.FAILED;
      session.failure_reason = String(options.reason).trim();

      if (session.started_at && !session.ended_at) {
        session.ended_at = now;
      }

      if (session.started_at && session.ended_at) {
        session.duration_seconds = Math.max(
          0,
          Math.floor((session.ended_at.getTime() - session.started_at.getTime()) / 1000),
        );
      }

      session.updated_by_user_id = options.actorUserId ?? null;
      return this.repository.updateSession(session, { manager });
    });
  }
}

