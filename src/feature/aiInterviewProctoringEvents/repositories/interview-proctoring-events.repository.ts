import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { InterviewProctoringEventQueryDto } from '../dto/interview-proctoring-event.query.dto';
import { InterviewProctoringEventEntity } from '../entities/interview-proctoring-event.entity';
import { ProctoringSeverity } from '../enums/proctoring-severity.enum';

export type InterviewProctoringEventListResult =
  | {
      mode: 'offset';
      data: InterviewProctoringEventEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: InterviewProctoringEventEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class InterviewProctoringEventsRepository {
  constructor(
    @InjectRepository(InterviewProctoringEventEntity)
    private readonly repository: Repository<InterviewProctoringEventEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<InterviewProctoringEventEntity> {
    return manager ? manager.getRepository(InterviewProctoringEventEntity) : this.repository;
  }

  private baseQuery(
    alias = 'interview_proctoring_events',
    manager?: EntityManager,
  ): SelectQueryBuilder<InterviewProctoringEventEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async createEvent(
    payload: Partial<InterviewProctoringEventEntity>,
    options?: { manager?: EntityManager },
  ): Promise<InterviewProctoringEventEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async createManyEvents(
    payloads: Partial<InterviewProctoringEventEntity>[],
    options?: { manager?: EntityManager },
  ): Promise<InterviewProctoringEventEntity[]> {
    if (!payloads.length) {
      return [];
    }

    const entities = this.repo(options?.manager).create(payloads);
    return this.repo(options?.manager).save(entities);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<InterviewProctoringEventEntity | null> {
    const qb = this.baseQuery('interview_proctoring_events', options?.manager)
      .andWhere('interview_proctoring_events.id = :id', { id });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async findBySessionId(
    sessionId: string,
    options?: { manager?: EntityManager },
  ): Promise<InterviewProctoringEventEntity[]> {
    return this.baseQuery('interview_proctoring_events', options?.manager)
      .andWhere('interview_proctoring_events.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .orderBy('interview_proctoring_events.occurred_at', 'DESC')
      .addOrderBy('interview_proctoring_events.id', 'ASC')
      .getMany();
  }

  async findAllWithFilters(
    query: InterviewProctoringEventQueryDto,
  ): Promise<InterviewProctoringEventListResult> {
    return this.list(query);
  }

  async updateEvent(
    entity: InterviewProctoringEventEntity,
    options?: { manager?: EntityManager },
  ): Promise<InterviewProctoringEventEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async softDeleteEvent(
    id: string,
    options: { actorUserId: string; manager?: EntityManager },
  ): Promise<void> {
    const now = new Date();

    await this.repo(options.manager)
      .createQueryBuilder()
      .update(InterviewProctoringEventEntity)
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

  async getEventsForRiskSummary(
    sessionId: string,
    options?: { manager?: EntityManager },
  ): Promise<InterviewProctoringEventEntity[]> {
    return this.baseQuery('interview_proctoring_events', options?.manager)
      .andWhere('interview_proctoring_events.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .orderBy('interview_proctoring_events.occurred_at', 'ASC')
      .addOrderBy('interview_proctoring_events.id', 'ASC')
      .getMany();
  }

  async list(
    query: InterviewProctoringEventQueryDto,
  ): Promise<InterviewProctoringEventListResult> {
    const qb = this.baseQuery('interview_proctoring_events');

    if (query.ai_interview_session_id) {
      qb.andWhere(
        'interview_proctoring_events.ai_interview_session_id = :sessionId',
        { sessionId: query.ai_interview_session_id },
      );
    }

    if (query.application_id) {
      qb.andWhere('interview_proctoring_events.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.candidate_id) {
      qb.andWhere('interview_proctoring_events.candidate_id = :candidateId', {
        candidateId: query.candidate_id,
      });
    }

    if (query.event_type) {
      qb.andWhere('interview_proctoring_events.event_type = :eventType', {
        eventType: query.event_type,
      });
    }

    if (query.severity) {
      qb.andWhere('interview_proctoring_events.severity = :severity', {
        severity: query.severity,
      });
    }

    if (query.is_resolved !== undefined) {
      qb.andWhere('interview_proctoring_events.is_resolved = :isResolved', {
        isResolved: query.is_resolved,
      });
    }

    if (query.occurred_from) {
      const from = new Date(query.occurred_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid occurred_from date',
          code: 'INVALID_OCCURRED_FROM',
        });
      }
      qb.andWhere('interview_proctoring_events.occurred_at >= :occurredFrom', {
        occurredFrom: from,
      });
    }

    if (query.occurred_to) {
      const to = new Date(query.occurred_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid occurred_to date',
          code: 'INVALID_OCCURRED_TO',
        });
      }
      qb.andWhere('interview_proctoring_events.occurred_at <= :occurredTo', {
        occurredTo: to,
      });
    }

    const orderDirection = (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'occurred_at';

    const allowedSort = [
      'created_at',
      'updated_at',
      'occurred_at',
      'severity',
      'event_type',
      'is_resolved',
    ] as const;

    if (!allowedSort.includes(sortBy as (typeof allowedSort)[number])) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    if (sortBy === 'severity') {
      qb.addSelect(
        `CASE
          WHEN interview_proctoring_events.severity = '${ProctoringSeverity.LOW}' THEN 1
          WHEN interview_proctoring_events.severity = '${ProctoringSeverity.MEDIUM}' THEN 2
          WHEN interview_proctoring_events.severity = '${ProctoringSeverity.HIGH}' THEN 3
          WHEN interview_proctoring_events.severity = '${ProctoringSeverity.CRITICAL}' THEN 4
          ELSE 99
        END`,
        'severity_sort_order',
      ).orderBy('severity_sort_order', orderDirection);
    } else {
      qb.orderBy(`interview_proctoring_events.${sortBy}`, orderDirection);
    }

    qb.addOrderBy('interview_proctoring_events.id', 'ASC');

    const limit = query.limit || 10;

    if (query.cursor) {
      if ((query.sort_by || 'occurred_at') !== 'occurred_at') {
        throw new BadRequestException({
          message: 'Cursor pagination is only supported with sort_by=occurred_at',
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
        qb.andWhere('interview_proctoring_events.occurred_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('interview_proctoring_events.occurred_at > :cursorDate', {
          cursorDate,
        });
      }

      const rows = await qb.clone().take(limit + 1).getMany();
      const hasMore = rows.length > limit;
      const data = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore
        ? data[data.length - 1]?.occurred_at?.toISOString() ?? null
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
    const [data, totalRecords] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: totalRecords,
    };
  }
}
