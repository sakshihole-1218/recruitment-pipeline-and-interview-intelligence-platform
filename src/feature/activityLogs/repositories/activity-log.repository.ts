import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListActivityLogsQueryDto } from '../dto/list-activity-logs.query.dto';
import { ActivityLogEntity } from '../entities/activity-log.entity';

export type ActivityLogListResult =
  | {
      mode: 'offset';
      data: ActivityLogEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: ActivityLogEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class ActivityLogRepository {
  constructor(
    @InjectRepository(ActivityLogEntity)
    private readonly repository: Repository<ActivityLogEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<ActivityLogEntity> {
    return manager ? manager.getRepository(ActivityLogEntity) : this.repository;
  }

  private baseQuery(
    alias = 'activity_logs',
    manager?: EntityManager,
  ): SelectQueryBuilder<ActivityLogEntity> {
    return this.repo(manager).createQueryBuilder(alias);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<ActivityLogEntity | null> {
    return this.baseQuery('activity_logs', options?.manager)
      .andWhere('activity_logs.id = :id', { id })
      .getOne();
  }

  async createAndSave(
    payload: Partial<ActivityLogEntity>,
    options?: { manager?: EntityManager },
  ): Promise<ActivityLogEntity> {
    const entity = this.repo(options?.manager).create({
      ...payload,
      action_at: payload.action_at ?? new Date(),
    });
    return this.repo(options?.manager).save(entity);
  }

  async list(query: ListActivityLogsQueryDto): Promise<ActivityLogListResult> {
    const qb = this.baseQuery('activity_logs');

    if (query.entity_type) {
      qb.andWhere('activity_logs.entity_type = :entityType', {
        entityType: query.entity_type,
      });
    }

    if (query.entity_id) {
      qb.andWhere('activity_logs.entity_id = :entityId', {
        entityId: query.entity_id,
      });
    }

    if (query.action_type) {
      qb.andWhere('activity_logs.action_type = :actionType', {
        actionType: query.action_type,
      });
    }

    if (query.action_by_user_id) {
      qb.andWhere('activity_logs.action_by_user_id = :actionByUserId', {
        actionByUserId: query.action_by_user_id,
      });
    }

    if (query.action_from) {
      const fromDate = new Date(query.action_from);
      qb.andWhere('activity_logs.action_at >= :fromDate', { fromDate });
    }

    if (query.action_to) {
      const toDate = new Date(query.action_to);
      qb.andWhere('activity_logs.action_at <= :toDate', { toDate });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';
    qb.orderBy(`activity_logs.${sortBy}`, orderDirection);
    qb.addOrderBy('activity_logs.id', 'ASC');

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
        qb.andWhere('activity_logs.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('activity_logs.created_at > :cursorDate', { cursorDate });
      }

      const rows = await qb.take(limit + 1).getMany();
      const hasMore = rows.length > limit;
      const data = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore
        ? data[data.length - 1]?.created_at
          ? new Date(data[data.length - 1].created_at).toISOString()
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
    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
