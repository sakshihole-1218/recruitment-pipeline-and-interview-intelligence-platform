import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListInterviewsQueryDto } from '../dto/list-interviews.query.dto';
import { InterviewEntity } from '../entities/interview.entity';

export type InterviewListResult =
  | {
      mode: 'offset';
      data: InterviewEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: InterviewEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class InterviewRepository {
  constructor(
    @InjectRepository(InterviewEntity)
    private readonly repository: Repository<InterviewEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<InterviewEntity> {
    return manager ? manager.getRepository(InterviewEntity) : this.repository;
  }

  private baseQuery(
    alias = 'interviews',
    manager?: EntityManager,
  ): SelectQueryBuilder<InterviewEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager; withRelations?: boolean },
  ): Promise<InterviewEntity | null> {
    const qb = this.baseQuery('interviews', options?.manager).andWhere(
      'interviews.id = :id',
      { id },
    );

    if (options?.withRelations) {
      qb.leftJoinAndSelect(
        'interviews.panel_members',
        'panel_members',
        'panel_members.deleted_at IS NULL',
      );
    }

    return qb.getOne();
  }

  async save(
    entity: InterviewEntity,
    options?: { manager?: EntityManager },
  ): Promise<InterviewEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<InterviewEntity>,
    options?: { manager?: EntityManager },
  ): Promise<InterviewEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async findDuplicateSchedule(options: {
    applicationId: string;
    interviewRoundId: string;
    scheduledStartAt: Date;
    scheduledEndAt: Date;
    manager?: EntityManager;
  }): Promise<InterviewEntity | null> {
    return this.baseQuery('interviews', options.manager)
      .andWhere('interviews.application_id = :applicationId', {
        applicationId: options.applicationId,
      })
      .andWhere('interviews.interview_round_id = :interviewRoundId', {
        interviewRoundId: options.interviewRoundId,
      })
      .andWhere('interviews.scheduled_start_at = :scheduledStartAt', {
        scheduledStartAt: options.scheduledStartAt,
      })
      .andWhere('interviews.scheduled_end_at = :scheduledEndAt', {
        scheduledEndAt: options.scheduledEndAt,
      })
      .getOne();
  }

  async list(query: ListInterviewsQueryDto): Promise<InterviewListResult> {
    const qb = this.baseQuery('interviews');

    qb.andWhere(
      `NOT EXISTS (
        SELECT 1
        FROM interviews rescheduled_children
        WHERE rescheduled_children.rescheduled_from_interview_id = interviews.id
          AND rescheduled_children.deleted_at IS NULL
      )`,
    );

    if (query.application_id) {
      qb.andWhere('interviews.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.interview_round_id) {
      qb.andWhere('interviews.interview_round_id = :roundId', {
        roundId: query.interview_round_id,
      });
    }

    if (query.interview_status) {
      if (query.interview_status === 'RESCHEDULED') {
        qb.andWhere(
          `(interviews.interview_status = :status OR (
            interviews.interview_status = :scheduledStatus
            AND interviews.rescheduled_from_interview_id IS NOT NULL
          ))`,
          {
            status: query.interview_status,
            scheduledStatus: 'SCHEDULED',
          },
        );
      } else if (query.interview_status === 'SCHEDULED') {
        qb.andWhere(
          `interviews.interview_status = :status
           AND interviews.rescheduled_from_interview_id IS NULL`,
          {
            status: query.interview_status,
          },
        );
      } else {
        qb.andWhere('interviews.interview_status = :status', {
          status: query.interview_status,
        });
      }
    }

    if (query.interview_mode) {
      qb.andWhere('interviews.interview_mode = :mode', {
        mode: query.interview_mode,
      });
    }

    if (query.scheduled_from) {
      qb.andWhere('interviews.scheduled_start_at >= :scheduledFrom', {
        scheduledFrom: new Date(query.scheduled_from),
      });
    }

    if (query.scheduled_to) {
      qb.andWhere('interviews.scheduled_start_at <= :scheduledTo', {
        scheduledTo: new Date(query.scheduled_to),
      });
    }

    if (query.interviewer_user_id) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM interview_panel_members ipm
          WHERE ipm.interview_id = interviews.id
            AND ipm.user_id = :interviewerUserId
            AND ipm.deleted_at IS NULL
        )`,
        { interviewerUserId: query.interviewer_user_id },
      );
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    const allowedSort = [
      'created_at',
      'updated_at',
      'scheduled_start_at',
      'scheduled_end_at',
      'completed_at',
      'interview_status',
    ] as const;

    if (!allowedSort.includes(sortBy as (typeof allowedSort)[number])) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`interviews.${sortBy}`, orderDirection);
    qb.addOrderBy('interviews.id', 'ASC');

    const limit = query.limit || 10;

    if (query.cursor) {
      const cursorDate = new Date(query.cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException({
          message: 'Invalid pagination cursor',
          code: 'INVALID_CURSOR',
        });
      }

      if (orderDirection === 'DESC') {
        qb.andWhere('interviews.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('interviews.created_at > :cursorDate', { cursorDate });
      }

      const idRows = await qb
        .clone()
        .select(['interviews.id AS id', 'interviews.created_at AS created_at'])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('interviews')
            .leftJoinAndSelect(
              'interviews.panel_members',
              'panel_members',
              'panel_members.deleted_at IS NULL',
            )
            .andWhere('interviews.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is InterviewEntity => Boolean(d));

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
      .select('COUNT(DISTINCT interviews.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select(['interviews.id AS id', `interviews.${sortBy} AS sort_value`])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('interviews')
          .leftJoinAndSelect(
            'interviews.panel_members',
            'panel_members',
            'panel_members.deleted_at IS NULL',
          )
          .andWhere('interviews.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is InterviewEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
