import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, ObjectLiteral, Repository } from 'typeorm';

import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';
import { AiInterviewQuestionEntity } from '../../aiInterviewQuestions/entities/ai-interview-question.entity';

@Injectable()
export class AiInterviewTranscriptsReferenceRepository {
  constructor(
    @InjectRepository(AiInterviewSessionEntity)
    private readonly sessions: Repository<AiInterviewSessionEntity>,
    @InjectRepository(AiInterviewQuestionEntity)
    private readonly questions: Repository<AiInterviewQuestionEntity>,
  ) {}

  private repo<T extends ObjectLiteral>(
    repo: Repository<T>,
    manager?: EntityManager,
  ): Repository<T> {
    return manager ? manager.getRepository<T>(repo.target as any) : repo;
  }

  findSessionById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewSessionEntity | null> {
    const qb = this.repo(this.sessions, options?.manager)
      .createQueryBuilder('ai_interview_sessions')
      .where('ai_interview_sessions.deleted_at IS NULL')
      .andWhere('ai_interview_sessions.id = :id', { id });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  findQuestionById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewQuestionEntity | null> {
    const qb = this.repo(this.questions, options?.manager)
      .createQueryBuilder('ai_interview_questions')
      .where('ai_interview_questions.deleted_at IS NULL')
      .andWhere('ai_interview_questions.id = :id', { id });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  findQuestionsByIds(
    ids: string[],
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewQuestionEntity[]> {
    if (!ids.length) {
      return Promise.resolve([]);
    }

    const qb = this.repo(this.questions, options?.manager)
      .createQueryBuilder('ai_interview_questions')
      .where('ai_interview_questions.deleted_at IS NULL')
      .andWhere({ id: In(ids) });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getMany();
  }

  saveQuestion(
    entity: AiInterviewQuestionEntity,
    manager?: EntityManager,
  ): Promise<AiInterviewQuestionEntity> {
    return this.repo(this.questions, manager).save(entity);
  }
}
