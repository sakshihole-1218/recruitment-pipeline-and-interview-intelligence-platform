import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';

@Injectable()
export class InterviewProctoringEventsReferenceRepository {
  constructor(
    @InjectRepository(AiInterviewSessionEntity)
    private readonly sessions: Repository<AiInterviewSessionEntity>,
  ) {}

  private repo<T extends ObjectLiteral>(
    repo: Repository<T>,
    manager?: EntityManager,
  ): Repository<T> {
    return manager ? manager.getRepository<T>(repo.target as any) : repo;
  }

  findSessionById(
    sessionId: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewSessionEntity | null> {
    const qb = this.repo(this.sessions, options?.manager)
      .createQueryBuilder('ai_interview_sessions')
      .where('ai_interview_sessions.id = :id', { id: sessionId })
      .andWhere('ai_interview_sessions.deleted_at IS NULL');

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }
}
