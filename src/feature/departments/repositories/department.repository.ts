import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { DepartmentEntity } from '../entities/department.entity';
import { ListDepartmentsQueryDto } from '../dto/list-departments.query.dto';
import { normalizeSearch } from '../../../common/utils/normalization.util';

export type DepartmentListResult =
  | {
      mode: 'offset';
      data: DepartmentEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: DepartmentEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class DepartmentRepository {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly repository: Repository<DepartmentEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<DepartmentEntity> {
    return manager ? manager.getRepository(DepartmentEntity) : this.repository;
  }

  private baseQuery(
    alias = 'departments',
    manager?: EntityManager,
  ): SelectQueryBuilder<DepartmentEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<DepartmentEntity | null> {
    return this.baseQuery('departments', options?.manager)
      .andWhere('departments.id = :id', { id })
      .getOne();
  }

  async findByCode(
    code: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<DepartmentEntity | null> {
    const normalized = String(code ?? '')
      .trim()
      .toUpperCase();
    if (!normalized) return null;

    const repo = this.repo(options?.manager);
    return repo.findOne({
      where: { code: normalized },
      withDeleted: options?.includeDeleted ?? false,
    });
  }

  async findByName(
    name: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<DepartmentEntity | null> {
    const normalized = normalizeSearch(name);
    if (!normalized) return null;

    const qb = this.repo(options?.manager)
      .createQueryBuilder('departments')
      .where('LOWER(departments.name) = LOWER(:name)', { name: normalized });

    if (!(options?.includeDeleted ?? false)) {
      qb.andWhere('departments.deleted_at IS NULL');
    }

    return qb.getOne();
  }

  async save(
    entity: DepartmentEntity,
    options?: { manager?: EntityManager },
  ): Promise<DepartmentEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<DepartmentEntity>,
    options?: { manager?: EntityManager },
  ): Promise<DepartmentEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async list(query: ListDepartmentsQueryDto): Promise<DepartmentListResult> {
    const qb = this.baseQuery('departments');

    const search = normalizeSearch(query.search);
    if (search) {
      qb.andWhere(
        '(departments.name ILIKE :search OR departments.code ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const codeFilter = normalizeSearch(query.code);
    if (codeFilter) {
      qb.andWhere('departments.code = :code', {
        code: String(codeFilter).trim().toUpperCase(),
      });
    }

    if (typeof query.is_active === 'boolean') {
      qb.andWhere('departments.is_active = :isActive', {
        isActive: query.is_active,
      });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    qb.orderBy(`departments.${sortBy}`, orderDirection);
    qb.addOrderBy('departments.id', 'ASC');

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
        qb.andWhere('departments.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('departments.created_at > :cursorDate', { cursorDate });
      }

      const idRows = await qb
        .clone()
        .select([
          'departments.id AS id',
          'departments.created_at AS created_at',
        ])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('departments')
            .andWhere('departments.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is DepartmentEntity => Boolean(d));

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
      .select('COUNT(DISTINCT departments.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select(['departments.id AS id', `departments.${sortBy} AS sort_value`])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('departments')
          .andWhere('departments.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is DepartmentEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
