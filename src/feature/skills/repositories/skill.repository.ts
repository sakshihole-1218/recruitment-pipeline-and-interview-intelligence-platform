import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { ListSkillsQueryDto } from '../dto/list-skills.query.dto';
import { SkillEntity } from '../entities/skill.entity';

export type SkillListResult =
  | {
      mode: 'offset';
      data: SkillEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: SkillEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class SkillRepository {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly repository: Repository<SkillEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<SkillEntity> {
    return manager ? manager.getRepository(SkillEntity) : this.repository;
  }

  private baseQuery(
    alias = 'skills',
    manager?: EntityManager,
  ): SelectQueryBuilder<SkillEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<SkillEntity | null> {
    return this.baseQuery('skills', options?.manager)
      .andWhere('skills.id = :id', { id })
      .getOne();
  }

  async findByCode(
    code: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<SkillEntity | null> {
    const normalized = String(code ?? '').trim().toUpperCase();
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
  ): Promise<SkillEntity | null> {
    const normalized = normalizeSearch(name);
    if (!normalized) return null;

    const qb = this.repo(options?.manager)
      .createQueryBuilder('skills')
      .where('LOWER(skills.name) = LOWER(:name)', { name: normalized });

    if (!(options?.includeDeleted ?? false)) {
      qb.andWhere('skills.deleted_at IS NULL');
    }

    return qb.getOne();
  }

  async save(
    entity: SkillEntity,
    options?: { manager?: EntityManager },
  ): Promise<SkillEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<SkillEntity>,
    options?: { manager?: EntityManager },
  ): Promise<SkillEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async list(query: ListSkillsQueryDto): Promise<SkillListResult> {
    const qb = this.baseQuery('skills');

    const nameFilter = normalizeSearch(query.name);
    if (nameFilter) {
      qb.andWhere('skills.name ILIKE :name', { name: `%${nameFilter}%` });
    }

    const codeFilter = String(query.code ?? '').trim().toUpperCase();
    if (codeFilter) {
      qb.andWhere('skills.code = :code', { code: codeFilter });
    }

    if (query.category) {
      qb.andWhere('skills.category = :category', { category: query.category });
    }

    if (typeof query.is_active === 'boolean') {
      qb.andWhere('skills.is_active = :isActive', { isActive: query.is_active });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    qb.orderBy(`skills.${sortBy}`, orderDirection);
    qb.addOrderBy('skills.id', 'ASC');

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
        qb.andWhere('skills.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('skills.created_at > :cursorDate', { cursorDate });
      }

      const idRows = await qb
        .clone()
        .select(['skills.id AS id', 'skills.created_at AS created_at'])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('skills')
            .andWhere('skills.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is SkillEntity => Boolean(d));

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
      .select('COUNT(DISTINCT skills.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select(['skills.id AS id', `skills.${sortBy} AS sort_value`])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('skills')
          .andWhere('skills.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is SkillEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
