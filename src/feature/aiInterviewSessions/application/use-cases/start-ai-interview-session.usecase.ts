import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AiInterviewSessionEntity } from '../../entities/ai-interview-session.entity';
import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';
import { AiInterviewSessionsValidationHelper } from '../../helpers/ai-interview-sessions-validation.helper';
import { AiInterviewSessionStatus } from '../../enums/ai-interview-session-status.enum';

@Injectable()
export class StartAiInterviewSessionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewSessionRepository,
    private readonly validation: AiInterviewSessionsValidationHelper,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<AiInterviewSessionEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

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

      this.validation.ensureCanStart(session.session_status);

      session.session_status = AiInterviewSessionStatus.IN_PROGRESS;
      session.started_at = now;
      session.updated_by_user_id = actorUserId;

      return this.repository.updateSession(session, { manager });
    });
  }
}

