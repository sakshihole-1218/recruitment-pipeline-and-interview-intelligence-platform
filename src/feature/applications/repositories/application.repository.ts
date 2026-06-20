import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { ListApplicationsQueryDto } from '../dto/list-applications.query.dto';
import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';
import { ApplicationEntity } from '../entities/application.entity';

export type ApplicationListResult =
  | {
      mode: 'offset';
      data: ApplicationEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: ApplicationEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class ApplicationRepository {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly repository: Repository<ApplicationEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<ApplicationEntity> {
    return manager ? manager.getRepository(ApplicationEntity) : this.repository;
  }

  private baseQuery(
    alias = 'applications',
    manager?: EntityManager,
  ): SelectQueryBuilder<ApplicationEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<ApplicationEntity | null> {
    return this.baseQuery('applications', options?.manager)
      .andWhere('applications.id = :id', { id })
      .getOne();
  }

  async save(
    entity: ApplicationEntity,
    options?: { manager?: EntityManager },
  ): Promise<ApplicationEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<ApplicationEntity>,
    options?: { manager?: EntityManager },
  ): Promise<ApplicationEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async findActiveByCandidateAndJobOpening(options: {
    candidateId: string;
    jobOpeningId: string;
    activeStatuses: ApplicationStatus[];
    manager?: EntityManager;
  }): Promise<ApplicationEntity | null> {
    return this.baseQuery('applications', options.manager)
      .andWhere('applications.candidate_id = :candidateId', {
        candidateId: options.candidateId,
      })
      .andWhere('applications.job_opening_id = :jobOpeningId', {
        jobOpeningId: options.jobOpeningId,
      })
      .andWhere('applications.application_status IN (:...activeStatuses)', {
        activeStatuses: options.activeStatuses,
      })
      .getOne();
  }

  async getNextApplicationNumberSequence(
    manager: EntityManager,
  ): Promise<number> {
    const rows = await manager.query(
      `SELECT nextval('application_number_seq')::bigint AS seq;`,
    );
    const seq = rows?.[0]?.seq;
    const parsed = typeof seq === 'string' ? Number(seq) : Number(seq);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException({
        message: 'Unable to generate application number',
        code: 'APPLICATION_NUMBER_GENERATION_FAILED',
      });
    }

    return parsed;
  }

  async list(query: ListApplicationsQueryDto): Promise<ApplicationListResult> {
    const qb = this.baseQuery('applications');

    const appNumber = normalizeSearch(query.application_number);
    if (appNumber) {
      qb.andWhere('applications.application_number ILIKE :appNumber', {
        appNumber: `%${appNumber}%`,
      });
    }

    if (query.candidate_id) {
      qb.andWhere('applications.candidate_id = :candidateId', {
        candidateId: query.candidate_id,
      });
    }

    if (query.job_opening_id) {
      qb.andWhere('applications.job_opening_id = :jobOpeningId', {
        jobOpeningId: query.job_opening_id,
      });
    }

    if (query.current_stage) {
      qb.andWhere('applications.current_stage = :stage', {
        stage: query.current_stage,
      });
    }

    if (query.application_status) {
      qb.andWhere('applications.application_status = :status', {
        status: query.application_status,
      });
    }

    if (query.assigned_recruiter_user_id) {
      qb.andWhere('applications.assigned_recruiter_user_id = :rid', {
        rid: query.assigned_recruiter_user_id,
      });
    }

    if (query.assigned_hiring_manager_user_id) {
      qb.andWhere('applications.assigned_hiring_manager_user_id = :hmId', {
        hmId: query.assigned_hiring_manager_user_id,
      });
    }

    if (typeof query.is_priority === 'boolean') {
      qb.andWhere('applications.is_priority = :priority', {
        priority: query.is_priority,
      });
    }

    if (query.applied_from) {
      const from = new Date(query.applied_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid applied_from date',
          code: 'INVALID_APPLIED_FROM',
        });
      }

      qb.andWhere('applications.applied_at >= :from', { from });
    }

    if (query.applied_to) {
      const to = new Date(query.applied_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid applied_to date',
          code: 'INVALID_APPLIED_TO',
        });
      }

      qb.andWhere('applications.applied_at <= :to', { to });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    if (!APPLICATION_SORTABLE_FIELDS.has(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`applications.${sortBy}`, orderDirection);
    qb.addOrderBy('applications.id', 'ASC');

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
        qb.andWhere('applications.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('applications.created_at > :cursorDate', { cursorDate });
      }

      const idRows = await qb
        .clone()
        .select([
          'applications.id AS id',
          'applications.created_at AS created_at',
        ])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('applications')
            .andWhere('applications.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is ApplicationEntity => Boolean(d));

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
      .select('COUNT(DISTINCT applications.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select(['applications.id AS id', `applications.${sortBy} AS sort_value`])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('applications')
          .andWhere('applications.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is ApplicationEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}

const APPLICATION_SORTABLE_FIELDS = new Set([
  'created_at',
  'updated_at',
  'applied_at',
  'application_number',
  'last_stage_changed_at',
  'current_stage',
  'application_status',
  'is_priority',
]);

export function isTerminalStage(stage: ApplicationCurrentStage): boolean {
  return (
    stage === ApplicationCurrentStage.REJECTED ||
    stage === ApplicationCurrentStage.WITHDRAWN ||
    stage === ApplicationCurrentStage.HIRED
  );
}
