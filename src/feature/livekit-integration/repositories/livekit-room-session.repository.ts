import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { LiveKitRoomQueryDto } from '../dto/livekit-room-query.dto';
import { LivekitRoomSessionEntity } from '../entities/livekit-room-session.entity';
import { LivekitRoomStatus } from '../enums/livekit-room-status.enum';

export type LivekitRoomListResult =
  | {
      mode: 'offset';
      data: LivekitRoomSessionEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: LivekitRoomSessionEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class LivekitRoomSessionRepository {
  constructor(
    @InjectRepository(LivekitRoomSessionEntity)
    private readonly repository: Repository<LivekitRoomSessionEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<LivekitRoomSessionEntity> {
    return manager
      ? manager.getRepository(LivekitRoomSessionEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'livekit_room_sessions',
    manager?: EntityManager,
  ): SelectQueryBuilder<LivekitRoomSessionEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  createRoomSession(
    payload: Partial<LivekitRoomSessionEntity>,
    options?: { manager?: EntityManager },
  ): Promise<LivekitRoomSessionEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  findById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<LivekitRoomSessionEntity | null> {
    const qb = this.baseQuery(
      'livekit_room_sessions',
      options?.manager,
    ).andWhere('livekit_room_sessions.id = :id', { id });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  findByAiInterviewSessionId(
    aiInterviewSessionId: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<LivekitRoomSessionEntity | null> {
    const qb = this.baseQuery('livekit_room_sessions', options?.manager)
      .andWhere(
        'livekit_room_sessions.ai_interview_session_id = :aiInterviewSessionId',
        { aiInterviewSessionId },
      )
      .orderBy('livekit_room_sessions.created_at', 'DESC')
      .addOrderBy('livekit_room_sessions.id', 'ASC');

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  findByRoomName(
    roomName: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<LivekitRoomSessionEntity | null> {
    const qb = this.baseQuery('livekit_room_sessions', options?.manager)
      .andWhere('livekit_room_sessions.room_name = :roomName', { roomName })
      .orderBy('livekit_room_sessions.created_at', 'DESC')
      .addOrderBy('livekit_room_sessions.id', 'ASC');

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  updateRoomSession(
    entity: LivekitRoomSessionEntity,
    options?: { manager?: EntityManager },
  ): Promise<LivekitRoomSessionEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async markRoomEnded(
    id: string,
    options?: {
      actorUserId?: string;
      roomEndedAt?: Date;
      metadata?: Record<string, unknown> | null;
      manager?: EntityManager;
    },
  ): Promise<void> {
    const now = options?.roomEndedAt ?? new Date();

    await this.repo(options?.manager)
      .createQueryBuilder()
      .update(LivekitRoomSessionEntity)
      .set({
        room_status: LivekitRoomStatus.ENDED,
        room_ended_at: now,
        last_webhook_event_at: now,
        metadata: (options?.metadata ?? null) as any,
        updated_at: now,
        updated_by_user_id: options?.actorUserId ?? null,
      })
      .where('id = :id', { id })
      .andWhere('deleted_at IS NULL')
      .execute();
  }

  async softDeleteRoomSession(
    id: string,
    options: { actorUserId: string; manager?: EntityManager },
  ): Promise<void> {
    const now = new Date();

    await this.repo(options.manager)
      .createQueryBuilder()
      .update(LivekitRoomSessionEntity)
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

  findAllWithFilters(
    query: LiveKitRoomQueryDto,
  ): Promise<LivekitRoomListResult> {
    return this.list(query);
  }

  async list(query: LiveKitRoomQueryDto): Promise<LivekitRoomListResult> {
    const qb = this.baseQuery('livekit_room_sessions');

    if (query.ai_interview_session_id) {
      qb.andWhere(
        'livekit_room_sessions.ai_interview_session_id = :aiInterviewSessionId',
        { aiInterviewSessionId: query.ai_interview_session_id },
      );
    }

    if (query.interview_id) {
      qb.andWhere('livekit_room_sessions.interview_id = :interviewId', {
        interviewId: query.interview_id,
      });
    }

    if (query.application_id) {
      qb.andWhere('livekit_room_sessions.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.candidate_id) {
      qb.andWhere('livekit_room_sessions.candidate_id = :candidateId', {
        candidateId: query.candidate_id,
      });
    }

    if (query.room_status) {
      qb.andWhere('livekit_room_sessions.room_status = :roomStatus', {
        roomStatus: query.room_status,
      });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    const allowedSort = [
      'created_at',
      'updated_at',
      'room_started_at',
      'room_ended_at',
      'last_webhook_event_at',
      'room_status',
    ] as const;

    if (!allowedSort.includes(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`livekit_room_sessions.${sortBy}`, orderDirection);
    qb.addOrderBy('livekit_room_sessions.id', 'ASC');

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
        qb.andWhere('livekit_room_sessions.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('livekit_room_sessions.created_at > :cursorDate', {
          cursorDate,
        });
      }

      const idRows = await qb
        .clone()
        .select([
          'livekit_room_sessions.id AS id',
          'livekit_room_sessions.created_at AS created_at',
        ])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((row) => row.id);

      const rows = ids.length
        ? await this.baseQuery('livekit_room_sessions')
            .andWhere('livekit_room_sessions.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((row) => [row.id, row] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((row): row is LivekitRoomSessionEntity => Boolean(row));

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
    const [data, total_records] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records,
    };
  }
}
