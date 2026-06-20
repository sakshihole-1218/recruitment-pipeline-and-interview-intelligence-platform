import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { AiInterviewFeedbackQueryDto } from '../dto/ai-interview-feedback.query.dto';
import { AiInterviewFeedbackEntity } from '../entities/ai-interview-feedback.entity';

export type AiInterviewFeedbackListResult =
  | {
      mode: 'offset';
      data: AiInterviewFeedbackEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: AiInterviewFeedbackEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class AiInterviewFeedbackRepository {
  constructor(
    @InjectRepository(AiInterviewFeedbackEntity)
    private readonly repository: Repository<AiInterviewFeedbackEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<AiInterviewFeedbackEntity> {
    return manager
      ? manager.getRepository(AiInterviewFeedbackEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'ai_interview_feedback',
    manager?: EntityManager,
  ): SelectQueryBuilder<AiInterviewFeedbackEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async createFeedback(
    payload: Partial<AiInterviewFeedbackEntity>,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewFeedbackEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewFeedbackEntity | null> {
    const qb = this.baseQuery(
      'ai_interview_feedback',
      options?.manager,
    ).andWhere('ai_interview_feedback.id = :id', { id });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async findBySessionId(
    sessionId: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewFeedbackEntity | null> {
    const qb = this.baseQuery('ai_interview_feedback', options?.manager)
      .andWhere('ai_interview_feedback.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .orderBy('ai_interview_feedback.updated_at', 'DESC')
      .addOrderBy('ai_interview_feedback.id', 'ASC');

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async findActiveBySessionId(
    sessionId: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewFeedbackEntity | null> {
    const qb = this.baseQuery('ai_interview_feedback', options?.manager)
      .andWhere('ai_interview_feedback.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .orderBy('ai_interview_feedback.updated_at', 'DESC')
      .addOrderBy('ai_interview_feedback.id', 'ASC');

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async existsActiveFeedbackForSession(
    sessionId: string,
    options?: { manager?: EntityManager },
  ): Promise<boolean> {
    const existing = await this.findActiveBySessionId(sessionId, options);
    return Boolean(existing);
  }

  async updateFeedback(
    entity: AiInterviewFeedbackEntity,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewFeedbackEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async softDeleteFeedback(
    id: string,
    options: { actorUserId: string; manager?: EntityManager },
  ): Promise<void> {
    const now = new Date();
    await this.repo(options.manager)
      .createQueryBuilder()
      .update(AiInterviewFeedbackEntity)
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
    query: AiInterviewFeedbackQueryDto,
  ): Promise<AiInterviewFeedbackListResult> {
    return this.list(query);
  }

  async list(
    query: AiInterviewFeedbackQueryDto,
  ): Promise<AiInterviewFeedbackListResult> {
    const qb = this.baseQuery('ai_interview_feedback');

    if (query.ai_interview_session_id) {
      qb.andWhere(
        'ai_interview_feedback.ai_interview_session_id = :aiInterviewSessionId',
        { aiInterviewSessionId: query.ai_interview_session_id },
      );
    }

    if (query.application_id) {
      qb.andWhere('ai_interview_feedback.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.candidate_id) {
      qb.andWhere('ai_interview_feedback.candidate_id = :candidateId', {
        candidateId: query.candidate_id,
      });
    }

    if (query.resume_analysis_id) {
      qb.andWhere(
        'ai_interview_feedback.resume_analysis_id = :resumeAnalysisId',
        {
          resumeAnalysisId: query.resume_analysis_id,
        },
      );
    }

    if (query.feedback_status) {
      qb.andWhere('ai_interview_feedback.feedback_status = :feedbackStatus', {
        feedbackStatus: query.feedback_status,
      });
    }

    if (query.ai_recommendation) {
      qb.andWhere(
        'ai_interview_feedback.ai_recommendation = :aiRecommendation',
        {
          aiRecommendation: query.ai_recommendation,
        },
      );
    }

    if (query.generated_from) {
      const from = new Date(query.generated_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid generated_from date',
          code: 'INVALID_GENERATED_FROM',
        });
      }
      qb.andWhere('ai_interview_feedback.generated_at >= :from', { from });
    }

    if (query.generated_to) {
      const to = new Date(query.generated_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid generated_to date',
          code: 'INVALID_GENERATED_TO',
        });
      }
      qb.andWhere('ai_interview_feedback.generated_at <= :to', { to });
    }

    if (query.search && String(query.search).trim()) {
      const search = `%${String(query.search).trim()}%`;
      qb.andWhere(
        `(
          COALESCE(ai_interview_feedback.technical_summary, '') ILIKE :search
          OR COALESCE(ai_interview_feedback.communication_summary, '') ILIKE :search
          OR COALESCE(ai_interview_feedback.problem_solving_summary, '') ILIKE :search
          OR COALESCE(ai_interview_feedback.project_understanding_summary, '') ILIKE :search
          OR COALESCE(ai_interview_feedback.strengths, '') ILIKE :search
          OR COALESCE(ai_interview_feedback.concerns, '') ILIKE :search
          OR COALESCE(ai_interview_feedback.improvement_areas, '') ILIKE :search
          OR COALESCE(ai_interview_feedback.failure_reason, '') ILIKE :search
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
      'generated_at',
      'overall_score',
      'feedback_status',
      'ai_recommendation',
    ] as const;

    if (!allowedSort.includes(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`ai_interview_feedback.${sortBy}`, orderDirection);
    qb.addOrderBy('ai_interview_feedback.id', 'ASC');

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
        qb.andWhere('ai_interview_feedback.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('ai_interview_feedback.created_at > :cursorDate', {
          cursorDate,
        });
      }

      const rows = await qb
        .clone()
        .take(limit + 1)
        .getMany();
      const hasMore = rows.length > limit;
      const data = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore
        ? (data[data.length - 1]?.created_at?.toISOString() ?? null)
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
