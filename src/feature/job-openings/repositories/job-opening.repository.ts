import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { ListJobOpeningsQueryDto } from '../dto/list-job-openings.query.dto';
import { JobOpeningEntity } from '../entities/job-opening.entity';

export type JobOpeningListResult =
  | {
      mode: 'offset';
      data: JobOpeningEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: JobOpeningEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class JobOpeningRepository {
  constructor(
    @InjectRepository(JobOpeningEntity)
    private readonly repository: Repository<JobOpeningEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<JobOpeningEntity> {
    return manager ? manager.getRepository(JobOpeningEntity) : this.repository;
  }

  private baseQuery(alias = 'job_openings', manager?: EntityManager): SelectQueryBuilder<JobOpeningEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.department`, 'department', 'department.deleted_at IS NULL')
      .leftJoinAndSelect(
        `${alias}.job_opening_skills`,
        'job_opening_skills',
        'job_opening_skills.deleted_at IS NULL',
      )
      .leftJoinAndSelect('job_opening_skills.skill', 'skills', 'skills.deleted_at IS NULL')
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(id: string, options?: { manager?: EntityManager }): Promise<JobOpeningEntity | null> {
    return this.baseQuery('job_openings', options?.manager)
      .andWhere('job_openings.id = :id', { id })
      .getOne();
  }

  async findByCode(
    code: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<JobOpeningEntity | null> {
    const normalized = String(code ?? '').trim().toUpperCase();
    if (!normalized) return null;

    const repo = this.repo(options?.manager);
    return repo.findOne({
      where: { code: normalized },
      withDeleted: options?.includeDeleted ?? false,
    });
  }

  async save(entity: JobOpeningEntity, options?: { manager?: EntityManager }): Promise<JobOpeningEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<JobOpeningEntity>,
    options?: { manager?: EntityManager },
  ): Promise<JobOpeningEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async list(query: ListJobOpeningsQueryDto): Promise<JobOpeningListResult> {
    const qb = this.baseQuery('job_openings');

    const titleFilter = normalizeSearch(query.title);
    if (titleFilter) {
      qb.andWhere('job_openings.title ILIKE :title', { title: `%${titleFilter}%` });
    }

    const codeFilter = String(query.code ?? '').trim().toUpperCase();
    if (codeFilter) {
      qb.andWhere('job_openings.code = :code', { code: codeFilter });
    }

    if (query.department_id) {
      qb.andWhere('job_openings.department_id = :departmentId', {
        departmentId: query.department_id,
      });
    }

    if (query.recruiter_user_id) {
      qb.andWhere('job_openings.recruiter_user_id = :recruiterUserId', {
        recruiterUserId: query.recruiter_user_id,
      });
    }

    if (query.hiring_manager_user_id) {
      qb.andWhere('job_openings.hiring_manager_user_id = :hiringManagerUserId', {
        hiringManagerUserId: query.hiring_manager_user_id,
      });
    }

    if (query.employment_type) {
      qb.andWhere('job_openings.employment_type = :employmentType', {
        employmentType: query.employment_type,
      });
    }

    if (query.work_mode) {
      qb.andWhere('job_openings.work_mode = :workMode', {
        workMode: query.work_mode,
      });
    }

    if (query.status) {
      qb.andWhere('job_openings.status = :status', { status: query.status });
    }

    if (typeof query.is_active === 'boolean') {
      qb.andWhere('job_openings.is_active = :isActive', { isActive: query.is_active });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    qb.orderBy(`job_openings.${sortBy}`, orderDirection);
    qb.addOrderBy('job_openings.id', 'ASC');

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
        qb.andWhere('job_openings.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('job_openings.created_at > :cursorDate', { cursorDate });
      }

      const idRows = await qb
        .clone()
        .select(['job_openings.id AS id', 'job_openings.created_at AS created_at'])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('job_openings')
            .andWhere('job_openings.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is JobOpeningEntity => Boolean(d));

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
      .select('COUNT(DISTINCT job_openings.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select(['job_openings.id AS id', `job_openings.${sortBy} AS sort_value`])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('job_openings')
          .andWhere('job_openings.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is JobOpeningEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
