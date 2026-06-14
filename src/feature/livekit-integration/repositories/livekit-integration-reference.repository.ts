import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';

@Injectable()
export class LivekitIntegrationReferenceRepository {
  constructor(
    @InjectRepository(AiInterviewSessionEntity)
    private readonly aiInterviewSessions: Repository<AiInterviewSessionEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<AiInterviewSessionEntity> {
    return manager
      ? manager.getRepository(AiInterviewSessionEntity)
      : this.aiInterviewSessions;
  }

  async findAiInterviewSessionById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewSessionEntity | null> {
    const qb = this.repo(options?.manager)
      .createQueryBuilder('ai_interview_sessions')
      .where('ai_interview_sessions.id = :id', { id })
      .andWhere('ai_interview_sessions.deleted_at IS NULL');

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  updateAiInterviewSession(
    entity: AiInterviewSessionEntity,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewSessionEntity> {
    return this.repo(options?.manager).save(entity);
  }
}
