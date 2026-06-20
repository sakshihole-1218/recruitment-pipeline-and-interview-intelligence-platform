import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListInterviewFeedbackQueryDto } from '../dto/list-interview-feedback.query.dto';
import { InterviewFeedbackEntity } from '../entities/interview-feedback.entity';
import { InterviewEntity } from '../entities/interview.entity';

export type InterviewFeedbackListResult =
  | {
      mode: 'offset';
      data: InterviewFeedbackEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: InterviewFeedbackEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class InterviewFeedbackRepository {
  constructor(
    @InjectRepository(InterviewFeedbackEntity)
    private readonly repository: Repository<InterviewFeedbackEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<InterviewFeedbackEntity> {
    return manager
      ? manager.getRepository(InterviewFeedbackEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'interview_feedback',
    manager?: EntityManager,
  ): SelectQueryBuilder<InterviewFeedbackEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findByInterviewAndInterviewer(
    interviewId: string,
    interviewerUserId: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<InterviewFeedbackEntity | null> {
    const repo = this.repo(options?.manager);

    return repo.findOne({
      where: {
        interview_id: interviewId,
        interviewer_user_id: interviewerUserId,
      },
      withDeleted: options?.includeDeleted ?? false,
    });
  }

  async save(
    entity: InterviewFeedbackEntity,
    options?: { manager?: EntityManager },
  ): Promise<InterviewFeedbackEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<InterviewFeedbackEntity>,
    options?: { manager?: EntityManager },
  ): Promise<InterviewFeedbackEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async list(
    query: ListInterviewFeedbackQueryDto,
  ): Promise<InterviewFeedbackListResult> {
    const qb = this.baseQuery('interview_feedback');

    if (query.interview_id) {
      qb.andWhere('interview_feedback.interview_id = :interviewId', {
        interviewId: query.interview_id,
      });
    }

    if (query.interviewer_user_id) {
      qb.andWhere(
        'interview_feedback.interviewer_user_id = :interviewerUserId',
        {
          interviewerUserId: query.interviewer_user_id,
        },
      );
    }

    if (query.recommendation) {
      qb.andWhere('interview_feedback.recommendation = :recommendation', {
        recommendation: query.recommendation,
      });
    }

    if (query.application_id) {
      qb.innerJoin(
        InterviewEntity,
        'interviews',
        'interviews.id = interview_feedback.interview_id AND interviews.deleted_at IS NULL',
      );
      qb.andWhere('interviews.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    const allowedSort = ['created_at', 'updated_at', 'submitted_at'] as const;
    if (!allowedSort.includes(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`interview_feedback.${sortBy}`, orderDirection);
    qb.addOrderBy('interview_feedback.id', 'ASC');

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
        qb.andWhere('interview_feedback.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('interview_feedback.created_at > :cursorDate', {
          cursorDate,
        });
      }

      const idRows = await qb
        .clone()
        .select([
          'interview_feedback.id AS id',
          'interview_feedback.created_at AS created_at',
        ])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('interview_feedback')
            .andWhere('interview_feedback.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is InterviewFeedbackEntity => Boolean(d));

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
      .select('COUNT(DISTINCT interview_feedback.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select([
        'interview_feedback.id AS id',
        `interview_feedback.${sortBy} AS sort_value`,
      ])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('interview_feedback')
          .andWhere('interview_feedback.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is InterviewFeedbackEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
