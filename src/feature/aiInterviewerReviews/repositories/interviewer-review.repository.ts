import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { InterviewerReviewQueryDto } from '../dto/interviewer-review.query.dto';
import { InterviewerReviewEntity } from '../entities/interviewer-review.entity';

export type InterviewerReviewListResult =
  | {
      mode: 'offset';
      data: InterviewerReviewEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: InterviewerReviewEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class InterviewerReviewRepository {
  constructor(
    @InjectRepository(InterviewerReviewEntity)
    private readonly repository: Repository<InterviewerReviewEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<InterviewerReviewEntity> {
    return manager
      ? manager.getRepository(InterviewerReviewEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'interviewer_reviews',
    manager?: EntityManager,
  ): SelectQueryBuilder<InterviewerReviewEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async createReview(
    payload: Partial<InterviewerReviewEntity>,
    options?: { manager?: EntityManager },
  ): Promise<InterviewerReviewEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<InterviewerReviewEntity | null> {
    const qb = this.baseQuery('interviewer_reviews', options?.manager).andWhere(
      'interviewer_reviews.id = :id',
      { id },
    );

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async findBySessionId(
    sessionId: string,
    options?: { manager?: EntityManager },
  ): Promise<InterviewerReviewEntity[]> {
    return this.baseQuery('interviewer_reviews', options?.manager)
      .andWhere('interviewer_reviews.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .orderBy('interviewer_reviews.reviewed_at', 'DESC', 'NULLS LAST')
      .addOrderBy('interviewer_reviews.created_at', 'DESC')
      .addOrderBy('interviewer_reviews.id', 'ASC')
      .getMany();
  }

  async findByApplicationId(
    applicationId: string,
    options?: { manager?: EntityManager },
  ): Promise<InterviewerReviewEntity[]> {
    return this.baseQuery('interviewer_reviews', options?.manager)
      .andWhere('interviewer_reviews.application_id = :applicationId', {
        applicationId,
      })
      .orderBy('interviewer_reviews.reviewed_at', 'DESC', 'NULLS LAST')
      .addOrderBy('interviewer_reviews.created_at', 'DESC')
      .addOrderBy('interviewer_reviews.id', 'ASC')
      .getMany();
  }

  async findByReviewerAndSession(
    reviewerUserId: string,
    sessionId: string,
    options?: { manager?: EntityManager; includeDeleted?: boolean },
  ): Promise<InterviewerReviewEntity | null> {
    const repo = this.repo(options?.manager);

    return repo.findOne({
      where: {
        reviewer_user_id: reviewerUserId,
        ai_interview_session_id: sessionId,
      },
      withDeleted: options?.includeDeleted ?? false,
    });
  }

  async existsActiveReviewByReviewerForSession(
    reviewerUserId: string,
    sessionId: string,
    options?: { manager?: EntityManager },
  ): Promise<boolean> {
    const count = await this.baseQuery('interviewer_reviews', options?.manager)
      .andWhere('interviewer_reviews.reviewer_user_id = :reviewerUserId', {
        reviewerUserId,
      })
      .andWhere('interviewer_reviews.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .getCount();

    return count > 0;
  }

  async updateReview(
    entity: InterviewerReviewEntity,
    options?: { manager?: EntityManager },
  ): Promise<InterviewerReviewEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async softDeleteReview(
    id: string,
    options: { actorUserId: string; manager?: EntityManager },
  ): Promise<void> {
    const now = new Date();
    await this.repo(options.manager)
      .createQueryBuilder()
      .update(InterviewerReviewEntity)
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
    query: InterviewerReviewQueryDto,
  ): Promise<InterviewerReviewListResult> {
    const qb = this.baseQuery('interviewer_reviews');

    if (query.ai_interview_session_id) {
      qb.andWhere(
        'interviewer_reviews.ai_interview_session_id = :aiInterviewSessionId',
        { aiInterviewSessionId: query.ai_interview_session_id },
      );
    }

    if (query.ai_interview_feedback_id) {
      qb.andWhere(
        'interviewer_reviews.ai_interview_feedback_id = :aiInterviewFeedbackId',
        { aiInterviewFeedbackId: query.ai_interview_feedback_id },
      );
    }

    if (query.application_id) {
      qb.andWhere('interviewer_reviews.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.candidate_id) {
      qb.andWhere('interviewer_reviews.candidate_id = :candidateId', {
        candidateId: query.candidate_id,
      });
    }

    if (query.reviewer_user_id) {
      qb.andWhere('interviewer_reviews.reviewer_user_id = :reviewerUserId', {
        reviewerUserId: query.reviewer_user_id,
      });
    }

    if (query.review_status) {
      qb.andWhere('interviewer_reviews.review_status = :reviewStatus', {
        reviewStatus: query.review_status,
      });
    }

    if (query.interviewer_recommendation) {
      qb.andWhere(
        'interviewer_reviews.interviewer_recommendation = :interviewerRecommendation',
        { interviewerRecommendation: query.interviewer_recommendation },
      );
    }

    if (query.reviewed_from) {
      const from = new Date(query.reviewed_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid reviewed_from date',
          code: 'INVALID_REVIEWED_FROM',
        });
      }
      qb.andWhere('interviewer_reviews.reviewed_at >= :from', { from });
    }

    if (query.reviewed_to) {
      const to = new Date(query.reviewed_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid reviewed_to date',
          code: 'INVALID_REVIEWED_TO',
        });
      }
      qb.andWhere('interviewer_reviews.reviewed_at <= :to', { to });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';
    const allowedSort = [
      'created_at',
      'updated_at',
      'reviewed_at',
      'overall_score',
      'review_status',
      'interviewer_recommendation',
    ] as const;

    if (!allowedSort.includes(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(
      `interviewer_reviews.${sortBy}`,
      orderDirection,
      sortBy === 'reviewed_at' ? 'NULLS LAST' : undefined,
    );
    qb.addOrderBy('interviewer_reviews.id', 'ASC');

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
        qb.andWhere('interviewer_reviews.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('interviewer_reviews.created_at > :cursorDate', {
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
