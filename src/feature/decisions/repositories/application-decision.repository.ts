import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListDecisionsQueryDto } from '../dto/list-decisions.query.dto';
import { ApplicationDecisionEntity } from '../entities/application-decision.entity';

export type ApplicationDecisionListResult =
  | {
      mode: 'offset';
      data: ApplicationDecisionEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: ApplicationDecisionEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class ApplicationDecisionRepository {
  constructor(
    @InjectRepository(ApplicationDecisionEntity)
    private readonly repository: Repository<ApplicationDecisionEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<ApplicationDecisionEntity> {
    return manager
      ? manager.getRepository(ApplicationDecisionEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'application_decisions',
    manager?: EntityManager,
  ): SelectQueryBuilder<ApplicationDecisionEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<ApplicationDecisionEntity | null> {
    return this.baseQuery('application_decisions', options?.manager)
      .andWhere('application_decisions.id = :id', { id })
      .getOne();
  }

  async findByApplicationId(
    applicationId: string,
    options?: { manager?: EntityManager },
  ): Promise<ApplicationDecisionEntity | null> {
    return this.baseQuery('application_decisions', options?.manager)
      .andWhere('application_decisions.application_id = :applicationId', {
        applicationId,
      })
      .getOne();
  }

  async save(
    entity: ApplicationDecisionEntity,
    options?: { manager?: EntityManager },
  ): Promise<ApplicationDecisionEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<ApplicationDecisionEntity>,
    options: { manager: EntityManager },
  ): Promise<ApplicationDecisionEntity> {
    const entity = this.repo(options.manager).create(payload);
    return this.repo(options.manager).save(entity);
  }

  async list(
    query: ListDecisionsQueryDto,
  ): Promise<ApplicationDecisionListResult> {
    const qb = this.baseQuery('application_decisions');

    if (query.application_id) {
      qb.andWhere('application_decisions.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.decision_status) {
      qb.andWhere('application_decisions.decision_status = :status', {
        status: query.decision_status,
      });
    }

    if (query.decided_by_user_id) {
      qb.andWhere('application_decisions.decided_by_user_id = :deciderId', {
        deciderId: query.decided_by_user_id,
      });
    }

    if (query.decision_source) {
      qb.andWhere('application_decisions.decision_source = :decisionSource', {
        decisionSource: query.decision_source,
      });
    }

    if (query.decision_from) {
      const from = new Date(query.decision_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid decision_from date',
          code: 'INVALID_DECISION_FROM',
        });
      }
      qb.andWhere('application_decisions.decision_at >= :from', { from });
    }

    if (query.decision_to) {
      const to = new Date(query.decision_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid decision_to date',
          code: 'INVALID_DECISION_TO',
        });
      }
      qb.andWhere('application_decisions.decision_at <= :to', { to });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    if (!DECISION_SORTABLE_FIELDS.has(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`application_decisions.${sortBy}`, orderDirection);
    qb.addOrderBy('application_decisions.id', 'ASC');

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
        qb.andWhere('application_decisions.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('application_decisions.created_at > :cursorDate', {
          cursorDate,
        });
      }

      const idRows = await qb
        .clone()
        .select([
          'application_decisions.id AS id',
          'application_decisions.created_at AS created_at',
        ])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('application_decisions')
            .andWhere('application_decisions.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is ApplicationDecisionEntity => Boolean(d));

      const nextCursor = hasMore
        ? pageRows[pageRows.length - 1]?.created_at
          ? new Date(pageRows[pageRows.length - 1].created_at).toISOString()
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
      .select('COUNT(DISTINCT application_decisions.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select([
        'application_decisions.id AS id',
        `application_decisions.${sortBy} AS sort_value`,
      ])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('application_decisions')
          .andWhere('application_decisions.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is ApplicationDecisionEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}

const DECISION_SORTABLE_FIELDS = new Set([
  'created_at',
  'updated_at',
  'decision_at',
  'decision_status',
]);
