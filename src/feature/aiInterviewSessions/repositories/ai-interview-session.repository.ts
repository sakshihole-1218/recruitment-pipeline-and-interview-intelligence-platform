import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { AiInterviewSessionQueryDto } from '../dto/ai-interview-session.query.dto';
import { AiInterviewSessionEntity } from '../entities/ai-interview-session.entity';
import { AiInterviewSessionStatus } from '../enums/ai-interview-session-status.enum';

export type AiInterviewSessionListResult =
  | {
      mode: 'offset';
      data: AiInterviewSessionEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: AiInterviewSessionEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class AiInterviewSessionRepository {
  constructor(
    @InjectRepository(AiInterviewSessionEntity)
    private readonly repository: Repository<AiInterviewSessionEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<AiInterviewSessionEntity> {
    return manager
      ? manager.getRepository(AiInterviewSessionEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'ai_interview_sessions',
    manager?: EntityManager,
  ): SelectQueryBuilder<AiInterviewSessionEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async createSession(
    payload: Partial<AiInterviewSessionEntity>,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewSessionEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewSessionEntity | null> {
    const qb = this.baseQuery('ai_interview_sessions', options?.manager)
      .andWhere('ai_interview_sessions.id = :id', { id });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async findByInterviewId(
    interviewId: string,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewSessionEntity[]> {
    return this.baseQuery('ai_interview_sessions', options?.manager)
      .andWhere('ai_interview_sessions.interview_id = :interviewId', {
        interviewId,
      })
      .orderBy('ai_interview_sessions.created_at', 'DESC')
      .addOrderBy('ai_interview_sessions.id', 'ASC')
      .getMany();
  }

  async findActiveByInterviewId(
    interviewId: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewSessionEntity | null> {
    const active = [
      AiInterviewSessionStatus.PENDING,
      AiInterviewSessionStatus.READY,
      AiInterviewSessionStatus.IN_PROGRESS,
    ];

    const qb = this.baseQuery('ai_interview_sessions', options?.manager)
      .andWhere('ai_interview_sessions.interview_id = :interviewId', {
        interviewId,
      })
      .andWhere('ai_interview_sessions.session_status IN (:...active)', {
        active,
      })
      .orderBy('ai_interview_sessions.created_at', 'DESC')
      .addOrderBy('ai_interview_sessions.id', 'ASC');

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async existsActiveSessionForInterview(
    interviewId: string,
    options?: { manager?: EntityManager },
  ): Promise<boolean> {
    const existing = await this.findActiveByInterviewId(interviewId, options);
    return Boolean(existing);
  }

  async checkSessionCodeExists(
    code: string,
    options?: { manager?: EntityManager },
  ): Promise<boolean> {
    const existing = await this.baseQuery('ai_interview_sessions', options?.manager)
      .andWhere('ai_interview_sessions.session_code = :code', { code })
      .getOne();
    return Boolean(existing);
  }

  async updateSession(
    entity: AiInterviewSessionEntity,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewSessionEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async softDeleteSession(
    id: string,
    options: { actorUserId: string; manager?: EntityManager },
  ): Promise<void> {
    const now = new Date();
    await this.repo(options.manager)
      .createQueryBuilder()
      .update(AiInterviewSessionEntity)
      .set({
        deleted_at: now,
        deleted_by_user_id: options.actorUserId,
        updated_at: now,
        updated_by_user_id: options.actorUserId,
      })
      .where('id = :id', { id })
      .andWhere('deleted_at IS NULL')
      .execute();
  }

  async findAllWithFilters(
    query: AiInterviewSessionQueryDto,
  ): Promise<AiInterviewSessionListResult> {
    return this.list(query);
  }

  async list(query: AiInterviewSessionQueryDto): Promise<AiInterviewSessionListResult> {
    const qb = this.baseQuery('ai_interview_sessions');

    if (query.interview_id) {
      qb.andWhere('ai_interview_sessions.interview_id = :interviewId', {
        interviewId: query.interview_id,
      });
    }

    if (query.application_id) {
      qb.andWhere('ai_interview_sessions.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.candidate_id) {
      qb.andWhere('ai_interview_sessions.candidate_id = :candidateId', {
        candidateId: query.candidate_id,
      });
    }

    if (query.resume_analysis_id) {
      qb.andWhere('ai_interview_sessions.resume_analysis_id = :resumeAnalysisId', {
        resumeAnalysisId: query.resume_analysis_id,
      });
    }

    if (query.session_status) {
      qb.andWhere('ai_interview_sessions.session_status = :sessionStatus', {
        sessionStatus: query.session_status,
      });
    }

    if (query.question_generation_status) {
      qb.andWhere(
        'ai_interview_sessions.question_generation_status = :questionStatus',
        { questionStatus: query.question_generation_status },
      );
    }

    if (query.feedback_generation_status) {
      qb.andWhere(
        'ai_interview_sessions.feedback_generation_status = :feedbackStatus',
        { feedbackStatus: query.feedback_generation_status },
      );
    }

    if (query.started_from) {
      const from = new Date(query.started_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid started_from date',
          code: 'INVALID_STARTED_FROM',
        });
      }
      qb.andWhere('ai_interview_sessions.started_at >= :from', { from });
    }

    if (query.started_to) {
      const to = new Date(query.started_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid started_to date',
          code: 'INVALID_STARTED_TO',
        });
      }
      qb.andWhere('ai_interview_sessions.started_at <= :to', { to });
    }

    if (query.search && String(query.search).trim()) {
      const search = `%${String(query.search).trim()}%`;
      qb.andWhere(
        `(
          COALESCE(ai_interview_sessions.session_code, '') ILIKE :search
          OR COALESCE(ai_interview_sessions.livekit_room_name, '') ILIKE :search
          OR COALESCE(ai_interview_sessions.failure_reason, '') ILIKE :search
        )`,
        { search },
      );
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    const allowedSort = [
      'created_at',
      'updated_at',
      'started_at',
      'ended_at',
      'session_status',
      'question_generation_status',
      'feedback_generation_status',
    ] as const;

    if (!allowedSort.includes(sortBy as (typeof allowedSort)[number])) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`ai_interview_sessions.${sortBy}`, orderDirection);
    qb.addOrderBy('ai_interview_sessions.id', 'ASC');

    const limit = query.limit || 10;

    if (query.cursor) {
      if ((query.sort_by || 'created_at') !== 'created_at') {
        throw new BadRequestException({
          message: 'Cursor pagination is only supported with sort_by=created_at',
          code: 'CURSOR_SORT_BY_REQUIRED',
        });
      }

      const cursorDate = new Date(query.cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException({
          message: 'Invalid pagination cursor',
          code: 'INVALID_CURSOR',
        });
      }

      if (orderDirection === 'DESC') {
        qb.andWhere('ai_interview_sessions.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('ai_interview_sessions.created_at > :cursorDate', {
          cursorDate,
        });
      }

      const idRows = await qb
        .clone()
        .select([
          'ai_interview_sessions.id AS id',
          'ai_interview_sessions.created_at AS created_at',
        ])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('ai_interview_sessions')
            .andWhere('ai_interview_sessions.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is AiInterviewSessionEntity => Boolean(d));

      const nextCursor = hasMore
        ? pageRows[pageRows.length - 1]?.created_at
          ? new Date(pageRows[pageRows.length - 1]!.created_at).toISOString()
          : null
        : null;

      return {
        mode: 'cursor',
        data,
        limit,
        next_cursor: nextCursor,
        has_more: hasMore,
      };
    }

    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const countQb = qb.clone();
    countQb.expressionMap.orderBys = {};

    const totalRaw = await countQb
      .select('COUNT(DISTINCT ai_interview_sessions.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select([
        'ai_interview_sessions.id AS id',
        `ai_interview_sessions.${sortBy} AS sort_value`,
      ])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('ai_interview_sessions')
          .andWhere('ai_interview_sessions.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is AiInterviewSessionEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
