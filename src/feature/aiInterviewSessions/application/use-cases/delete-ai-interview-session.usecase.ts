import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';
import { AiInterviewSessionsValidationHelper } from '../../helpers/ai-interview-sessions-validation.helper';

@Injectable()
export class DeleteAiInterviewSessionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewSessionRepository,
    private readonly validation: AiInterviewSessionsValidationHelper,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    this.validation.ensureActorUserRequired(actorUserId);

    return this.dataSource.transaction(async (manager) => {
      const existing = await this.repository.findById(id, {
        manager,
        lockForUpdate: true,
      });

      if (!existing) {
        throw new NotFoundException({
          message: 'AI interview session not found',
          code: 'AI_SESSION_NOT_FOUND',
        });
      }

      await this.repository.softDeleteSession(id, {
        actorUserId,
        manager,
      });
    });
  }
}
