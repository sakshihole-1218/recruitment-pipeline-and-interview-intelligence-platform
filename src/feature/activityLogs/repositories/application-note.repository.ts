import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import { ListApplicationNotesQueryDto } from '../dto/list-application-notes.query.dto';
import { ApplicationNoteEntity } from '../entities/application-note.entity';

export type ApplicationNoteListResult =
  | {
      mode: 'offset';
      data: ApplicationNoteEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: ApplicationNoteEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class ApplicationNoteRepository {
  constructor(
    @InjectRepository(ApplicationNoteEntity)
    private readonly repository: Repository<ApplicationNoteEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<ApplicationNoteEntity> {
    return manager ? manager.getRepository(ApplicationNoteEntity) : this.repository;
  }

  private baseQuery(
    alias = 'application_notes',
    manager?: EntityManager,
  ): SelectQueryBuilder<ApplicationNoteEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(id: string, options?: { manager?: EntityManager }): Promise<ApplicationNoteEntity | null> {
    return this.baseQuery('application_notes', options?.manager)
      .andWhere('application_notes.id = :id', { id })
      .getOne();
  }

  async save(entity: ApplicationNoteEntity, options?: { manager?: EntityManager }): Promise<ApplicationNoteEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<ApplicationNoteEntity>,
    options?: { manager?: EntityManager },
  ): Promise<ApplicationNoteEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async listByApplication(options: {
    applicationId: string;
    query: ListApplicationNotesQueryDto;
    actorUserId?: string;
    includeAllPrivate?: boolean;
  }): Promise<ApplicationNoteListResult> {
    const qb = this.baseQuery('application_notes')
      .andWhere('application_notes.application_id = :applicationId', {
        applicationId: options.applicationId,
      });

    if (options.query.user_id) {
      qb.andWhere('application_notes.user_id = :userId', {
        userId: options.query.user_id,
      });
    }

    if (options.query.note_type) {
      qb.andWhere('application_notes.note_type = :noteType', {
        noteType: options.query.note_type,
      });
    }

    const includeAllPrivate = Boolean(options.includeAllPrivate);
    const actorUserId = options.actorUserId;
    if (typeof options.query.is_private === 'boolean') {
      if (options.query.is_private === true && !includeAllPrivate) {
        if (!actorUserId) {
          qb.andWhere('1 = 0');
        } else {
          qb.andWhere('application_notes.is_private = true');
          qb.andWhere('application_notes.user_id = :actorUserId', { actorUserId });
        }
      } else {
        qb.andWhere('application_notes.is_private = :isPrivate', {
          isPrivate: options.query.is_private,
        });
      }
    } else if (!includeAllPrivate) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('application_notes.is_private = false');
          if (actorUserId) {
            w.orWhere(
              'application_notes.is_private = true AND application_notes.user_id = :actorUserId',
              { actorUserId },
            );
          }
        }),
      );
    }

    const orderDirection =
      (options.query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = options.query.sort_by || 'created_at';

    qb.orderBy(`application_notes.${sortBy}`, orderDirection);
    qb.addOrderBy('application_notes.id', 'ASC');

    const limit = options.query.limit || 10;

    if (options.query.cursor) {
      const cursorDate = new Date(options.query.cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException({
          message: 'Invalid pagination cursor',
          code: 'INVALID_CURSOR',
        });
      }

      if (orderDirection === 'DESC') {
        qb.andWhere('application_notes.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('application_notes.created_at > :cursorDate', { cursorDate });
      }

      const rows = await qb.take(limit + 1).getMany();
      const hasMore = rows.length > limit;
      const data = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore
        ? data[data.length - 1]?.created_at
          ? new Date(data[data.length - 1]!.created_at).toISOString()
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

    const page = options.query.page || 1;
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
