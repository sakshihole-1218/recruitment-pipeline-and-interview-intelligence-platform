import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListFeedbackAiSummariesQueryDto } from '../dto/list-feedback-ai-summaries.query.dto';
import { FeedbackAiSummaryEntity } from '../entities/feedback-ai-summary.entity';

export type FeedbackAiSummaryListResult =
  | {
      mode: 'offset';
      data: FeedbackAiSummaryEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: FeedbackAiSummaryEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class FeedbackAiSummaryRepository {
  constructor(
    @InjectRepository(FeedbackAiSummaryEntity)
    private readonly repository: Repository<FeedbackAiSummaryEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<FeedbackAiSummaryEntity> {
    return manager
      ? manager.getRepository(FeedbackAiSummaryEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'feedback_ai_summaries',
    manager?: EntityManager,
  ): SelectQueryBuilder<FeedbackAiSummaryEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<FeedbackAiSummaryEntity | null> {
    return this.baseQuery('feedback_ai_summaries', options?.manager)
      .andWhere('feedback_ai_summaries.id = :id', { id })
      .getOne();
  }

  // --- requested method names (wrappers) ---
  createFeedbackSummary(
    payload: Partial<FeedbackAiSummaryEntity>,
    options?: { manager?: EntityManager },
  ): Promise<FeedbackAiSummaryEntity> {
    return this.createAndSave(payload, options);
  }

  findFeedbackSummaryById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<FeedbackAiSummaryEntity | null> {
    return this.findById(id, options);
  }

  findByApplicationId(
    applicationId: string,
    options?: { manager?: EntityManager },
  ): Promise<FeedbackAiSummaryEntity | null> {
    return this.findActiveByApplicationId(applicationId, options);
  }

  findAllFeedbackSummariesWithFilters(
    query: ListFeedbackAiSummariesQueryDto,
  ): Promise<FeedbackAiSummaryListResult> {
    return this.list(query);
  }

  async existsActiveSummaryForApplication(
    applicationId: string,
    options?: { manager?: EntityManager },
  ): Promise<boolean> {
    const existing = await this.findActiveByApplicationId(applicationId, options);
    return Boolean(existing);
  }

  updateFeedbackSummary(
    entity: FeedbackAiSummaryEntity,
    options?: { manager?: EntityManager },
  ): Promise<FeedbackAiSummaryEntity> {
    return this.save(entity, options);
  }

  async softDeleteFeedbackSummary(
    id: string,
    options: { actorUserId: string; manager?: EntityManager },
  ): Promise<void> {
    const now = new Date();
    await this.repo(options.manager)
      .createQueryBuilder()
      .update(FeedbackAiSummaryEntity)
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

  async findActiveByApplicationId(
    applicationId: string,
    options?: { manager?: EntityManager },
  ): Promise<FeedbackAiSummaryEntity | null> {
    return this.baseQuery('feedback_ai_summaries', options?.manager)
      .andWhere('feedback_ai_summaries.application_id = :applicationId', {
        applicationId,
      })
      .getOne();
  }

  async createAndSave(
    payload: Partial<FeedbackAiSummaryEntity>,
    options?: { manager?: EntityManager },
  ): Promise<FeedbackAiSummaryEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async save(
    entity: FeedbackAiSummaryEntity,
    options?: { manager?: EntityManager },
  ): Promise<FeedbackAiSummaryEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async list(
    query: ListFeedbackAiSummariesQueryDto,
  ): Promise<FeedbackAiSummaryListResult> {
    const qb = this.baseQuery('feedback_ai_summaries');

    if (query.application_id) {
      qb.andWhere('feedback_ai_summaries.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.final_ai_recommendation) {
      qb.andWhere(
        'feedback_ai_summaries.final_ai_recommendation = :rec',
        {
          rec: query.final_ai_recommendation,
        },
      );
    }

    if (query.generation_status) {
      qb.andWhere('feedback_ai_summaries.generation_status = :status', {
        status: query.generation_status,
      });
    }

    if (query.generated_from) {
      const from = new Date(query.generated_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid generated_from date',
          code: 'INVALID_GENERATED_FROM',
        });
      }
      qb.andWhere('feedback_ai_summaries.generated_at >= :from', { from });
    }

    if (query.generated_to) {
      const to = new Date(query.generated_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid generated_to date',
          code: 'INVALID_GENERATED_TO',
        });
      }
      qb.andWhere('feedback_ai_summaries.generated_at <= :to', { to });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    const allowedSort = [
      'created_at',
      'updated_at',
      'generated_at',
      'final_ai_recommendation',
    ] as const;

    if (!allowedSort.includes(sortBy as (typeof allowedSort)[number])) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`feedback_ai_summaries.${sortBy}`, orderDirection);
    qb.addOrderBy('feedback_ai_summaries.id', 'ASC');

    const limit = query.limit || 10;

    if (query.cursor) {
      if ((query.sort_by || 'created_at') !== 'created_at') {
        throw new BadRequestException({
          message:
            'Cursor pagination is only supported with sort_by=created_at',
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
        qb.andWhere('feedback_ai_summaries.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('feedback_ai_summaries.created_at > :cursorDate', {
          cursorDate,
        });
      }

      const idRows = await qb
        .clone()
        .select([
          'feedback_ai_summaries.id AS id',
          'feedback_ai_summaries.created_at AS created_at',
        ])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('feedback_ai_summaries')
            .andWhere('feedback_ai_summaries.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is FeedbackAiSummaryEntity => Boolean(d));

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
      .select('COUNT(DISTINCT feedback_ai_summaries.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select([
        'feedback_ai_summaries.id AS id',
        `feedback_ai_summaries.${sortBy} AS sort_value`,
      ])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('feedback_ai_summaries')
          .andWhere('feedback_ai_summaries.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is FeedbackAiSummaryEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
