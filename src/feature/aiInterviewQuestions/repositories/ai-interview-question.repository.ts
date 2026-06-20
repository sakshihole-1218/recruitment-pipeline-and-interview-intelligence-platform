import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { AiInterviewQuestionQueryDto } from '../dto/ai-interview-question.query.dto';
import { AiInterviewQuestionEntity } from '../entities/ai-interview-question.entity';

export type AiInterviewQuestionListResult =
  | {
      mode: 'offset';
      data: AiInterviewQuestionEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: AiInterviewQuestionEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class AiInterviewQuestionRepository {
  constructor(
    @InjectRepository(AiInterviewQuestionEntity)
    private readonly repository: Repository<AiInterviewQuestionEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<AiInterviewQuestionEntity> {
    return manager
      ? manager.getRepository(AiInterviewQuestionEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'ai_interview_questions',
    manager?: EntityManager,
  ): SelectQueryBuilder<AiInterviewQuestionEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async createQuestion(
    payload: Partial<AiInterviewQuestionEntity>,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewQuestionEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async createManyQuestions(
    payloads: Partial<AiInterviewQuestionEntity>[],
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewQuestionEntity[]> {
    if (!payloads.length) {
      return [];
    }

    const entities = this.repo(options?.manager).create(payloads);
    return this.repo(options?.manager).save(entities);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewQuestionEntity | null> {
    const qb = this.baseQuery(
      'ai_interview_questions',
      options?.manager,
    ).andWhere('ai_interview_questions.id = :id', { id });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async findBySessionId(
    sessionId: string,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewQuestionEntity[]> {
    return this.baseQuery('ai_interview_questions', options?.manager)
      .andWhere('ai_interview_questions.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .orderBy('ai_interview_questions.sequence_number', 'ASC')
      .addOrderBy('ai_interview_questions.created_at', 'ASC')
      .getMany();
  }

  async findRootQuestionsBySessionId(
    sessionId: string,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewQuestionEntity[]> {
    return this.baseQuery('ai_interview_questions', options?.manager)
      .andWhere('ai_interview_questions.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .andWhere('ai_interview_questions.parent_question_id IS NULL')
      .orderBy('ai_interview_questions.sequence_number', 'ASC')
      .addOrderBy('ai_interview_questions.created_at', 'ASC')
      .getMany();
  }

  async findFollowUpsByQuestionId(
    questionId: string,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewQuestionEntity[]> {
    return this.baseQuery('ai_interview_questions', options?.manager)
      .andWhere('ai_interview_questions.parent_question_id = :questionId', {
        questionId,
      })
      .orderBy('ai_interview_questions.sequence_number', 'ASC')
      .addOrderBy('ai_interview_questions.created_at', 'ASC')
      .getMany();
  }

  async updateQuestion(
    entity: AiInterviewQuestionEntity,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewQuestionEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async softDeleteQuestion(
    id: string,
    options: { actorUserId: string; manager?: EntityManager },
  ): Promise<void> {
    const now = new Date();

    await this.repo(options.manager)
      .createQueryBuilder()
      .update(AiInterviewQuestionEntity)
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
    query: AiInterviewQuestionQueryDto,
  ): Promise<AiInterviewQuestionListResult> {
    return this.list(query);
  }

  async list(
    query: AiInterviewQuestionQueryDto,
  ): Promise<AiInterviewQuestionListResult> {
    const qb = this.baseQuery('ai_interview_questions');

    if (query.ai_interview_session_id) {
      qb.andWhere(
        'ai_interview_questions.ai_interview_session_id = :aiInterviewSessionId',
        { aiInterviewSessionId: query.ai_interview_session_id },
      );
    }

    if (query.question_type) {
      qb.andWhere('ai_interview_questions.question_type = :questionType', {
        questionType: query.question_type,
      });
    }

    if (query.difficulty_level) {
      qb.andWhere(
        'ai_interview_questions.difficulty_level = :difficultyLevel',
        {
          difficultyLevel: query.difficulty_level,
        },
      );
    }

    if (query.generated_from) {
      qb.andWhere('ai_interview_questions.generated_from = :generatedFrom', {
        generatedFrom: query.generated_from,
      });
    }

    if (query.is_follow_up !== undefined) {
      qb.andWhere('ai_interview_questions.is_follow_up = :isFollowUp', {
        isFollowUp: query.is_follow_up,
      });
    }

    if (query.is_answered !== undefined) {
      qb.andWhere('ai_interview_questions.is_answered = :isAnswered', {
        isAnswered: query.is_answered,
      });
    }

    if (query.search && String(query.search).trim()) {
      const search = `%${String(query.search).trim()}%`;
      qb.andWhere(
        `(
          COALESCE(ai_interview_questions.question_text, '') ILIKE :search
          OR COALESCE(ai_interview_questions.topic, '') ILIKE :search
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
      'sequence_number',
      'asked_at',
      'answered_at',
      'question_type',
      'difficulty_level',
      'generated_from',
      'topic',
    ] as const;

    if (!allowedSort.includes(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`ai_interview_questions.${sortBy}`, orderDirection);
    qb.addOrderBy('ai_interview_questions.id', 'ASC');

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
        qb.andWhere('ai_interview_questions.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('ai_interview_questions.created_at > :cursorDate', {
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
