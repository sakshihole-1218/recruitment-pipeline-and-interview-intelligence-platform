import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { TranscriptQueryDto } from '../dto/transcript-query.dto';
import { AiInterviewTranscriptEntity } from '../entities/ai-interview-transcript.entity';

export type AiInterviewTranscriptListResult =
  | {
      mode: 'offset';
      data: AiInterviewTranscriptEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: AiInterviewTranscriptEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class AiInterviewTranscriptRepository {
  constructor(
    @InjectRepository(AiInterviewTranscriptEntity)
    private readonly repository: Repository<AiInterviewTranscriptEntity>,
  ) {}

  private repo(
    manager?: EntityManager,
  ): Repository<AiInterviewTranscriptEntity> {
    return manager
      ? manager.getRepository(AiInterviewTranscriptEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'ai_interview_transcripts',
    manager?: EntityManager,
  ): SelectQueryBuilder<AiInterviewTranscriptEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async createEntry(
    payload: Partial<AiInterviewTranscriptEntity>,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewTranscriptEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async createManyEntries(
    payloads: Partial<AiInterviewTranscriptEntity>[],
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewTranscriptEntity[]> {
    if (!payloads.length) {
      return [];
    }

    const entities = this.repo(options?.manager).create(payloads);
    return this.repo(options?.manager).save(entities);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewTranscriptEntity | null> {
    const qb = this.baseQuery(
      'ai_interview_transcripts',
      options?.manager,
    ).andWhere('ai_interview_transcripts.id = :id', { id });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async findBySessionId(
    sessionId: string,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewTranscriptEntity[]> {
    return this.baseQuery('ai_interview_transcripts', options?.manager)
      .andWhere(
        'ai_interview_transcripts.ai_interview_session_id = :sessionId',
        {
          sessionId,
        },
      )
      .orderBy('ai_interview_transcripts.sequence_number', 'ASC')
      .addOrderBy('ai_interview_transcripts.created_at', 'ASC')
      .getMany();
  }

  async findCandidateEntriesByQuestionId(
    questionId: string,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewTranscriptEntity[]> {
    return this.baseQuery('ai_interview_transcripts', options?.manager)
      .andWhere(
        'ai_interview_transcripts.ai_interview_question_id = :questionId',
        {
          questionId,
        },
      )
      .andWhere('ai_interview_transcripts.speaker_type = :speakerType', {
        speakerType: 'CANDIDATE',
      })
      .orderBy('ai_interview_transcripts.sequence_number', 'ASC')
      .addOrderBy('ai_interview_transcripts.created_at', 'ASC')
      .getMany();
  }

  async findAllWithFilters(
    query: TranscriptQueryDto,
  ): Promise<AiInterviewTranscriptListResult> {
    return this.list(query);
  }

  async getNextSequenceNumber(
    sessionId: string,
    options?: { manager?: EntityManager },
  ): Promise<number> {
    const raw = await this.baseQuery(
      'ai_interview_transcripts',
      options?.manager,
    )
      .select(
        'COALESCE(MAX(ai_interview_transcripts.sequence_number), 0)',
        'max_sequence',
      )
      .andWhere(
        'ai_interview_transcripts.ai_interview_session_id = :sessionId',
        {
          sessionId,
        },
      )
      .getRawOne<{ max_sequence: string }>();

    return Number(raw?.max_sequence || 0) + 1;
  }

  async updateEntry(
    entity: AiInterviewTranscriptEntity,
    options?: { manager?: EntityManager },
  ): Promise<AiInterviewTranscriptEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async softDeleteEntry(
    id: string,
    options: { actorUserId: string; manager?: EntityManager },
  ): Promise<void> {
    const now = new Date();

    await this.repo(options.manager)
      .createQueryBuilder()
      .update(AiInterviewTranscriptEntity)
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

  async existsSequenceNumberForSession(
    sessionId: string,
    sequenceNumber: number,
    options?: { manager?: EntityManager },
  ): Promise<boolean> {
    const count = await this.baseQuery(
      'ai_interview_transcripts',
      options?.manager,
    )
      .andWhere(
        'ai_interview_transcripts.ai_interview_session_id = :sessionId',
        {
          sessionId,
        },
      )
      .andWhere('ai_interview_transcripts.sequence_number = :sequenceNumber', {
        sequenceNumber,
      })
      .getCount();

    return count > 0;
  }

  async list(
    query: TranscriptQueryDto,
  ): Promise<AiInterviewTranscriptListResult> {
    const qb = this.baseQuery('ai_interview_transcripts');

    if (query.ai_interview_session_id) {
      qb.andWhere(
        'ai_interview_transcripts.ai_interview_session_id = :aiInterviewSessionId',
        { aiInterviewSessionId: query.ai_interview_session_id },
      );
    }

    if (query.ai_interview_question_id) {
      qb.andWhere(
        'ai_interview_transcripts.ai_interview_question_id = :aiInterviewQuestionId',
        { aiInterviewQuestionId: query.ai_interview_question_id },
      );
    }

    if (query.speaker_type) {
      qb.andWhere('ai_interview_transcripts.speaker_type = :speakerType', {
        speakerType: query.speaker_type,
      });
    }

    if (query.spoken_from) {
      qb.andWhere('ai_interview_transcripts.spoken_at >= :spokenFrom', {
        spokenFrom: new Date(query.spoken_from),
      });
    }

    if (query.spoken_to) {
      qb.andWhere('ai_interview_transcripts.spoken_at <= :spokenTo', {
        spokenTo: new Date(query.spoken_to),
      });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    const allowedSort = [
      'created_at',
      'updated_at',
      'sequence_number',
      'spoken_at',
      'speaker_type',
    ] as const;

    if (!allowedSort.includes(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    if (sortBy === 'spoken_at') {
      qb.orderBy(
        `ai_interview_transcripts.${sortBy}`,
        orderDirection,
        'NULLS LAST',
      );
    } else {
      qb.orderBy(`ai_interview_transcripts.${sortBy}`, orderDirection);
    }
    qb.addOrderBy('ai_interview_transcripts.id', 'ASC');

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
        qb.andWhere('ai_interview_transcripts.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('ai_interview_transcripts.created_at > :cursorDate', {
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
