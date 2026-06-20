import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { ListCandidatesQueryDto } from '../dto/list-candidates.query.dto';
import { CandidateEntity } from '../entities/candidate.entity';

export type CandidateListResult =
  | {
      mode: 'offset';
      data: CandidateEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: CandidateEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class CandidateRepository {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly repository: Repository<CandidateEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<CandidateEntity> {
    return manager ? manager.getRepository(CandidateEntity) : this.repository;
  }

  private baseQuery(
    alias = 'candidates',
    manager?: EntityManager,
  ): SelectQueryBuilder<CandidateEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<CandidateEntity | null> {
    return this.baseQuery('candidates', options?.manager)
      .andWhere('candidates.id = :id', { id })
      .getOne();
  }

  async findByIdIncludingDeleted(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<CandidateEntity | null> {
    const repo = this.repo(options?.manager);
    return repo.findOne({ where: { id }, withDeleted: true });
  }

  async findByEmail(
    email: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<CandidateEntity | null> {
    const normalized = String(email ?? '')
      .trim()
      .toLowerCase();
    if (!normalized) return null;

    const qb = this.repo(options?.manager)
      .createQueryBuilder('candidates')
      .where('candidates.email = :email', { email: normalized });

    if (!(options?.includeDeleted ?? false)) {
      qb.andWhere('candidates.deleted_at IS NULL');
    }

    return qb.getOne();
  }

  async findByPhone(
    phone: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<CandidateEntity | null> {
    const normalized = String(phone ?? '').trim();
    if (!normalized) return null;

    const qb = this.repo(options?.manager)
      .createQueryBuilder('candidates')
      .where('candidates.phone = :phone', { phone: normalized });

    if (!(options?.includeDeleted ?? false)) {
      qb.andWhere('candidates.deleted_at IS NULL');
    }

    return qb.getOne();
  }

  async save(
    entity: CandidateEntity,
    options?: { manager?: EntityManager },
  ): Promise<CandidateEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<CandidateEntity>,
    options?: { manager?: EntityManager },
  ): Promise<CandidateEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async list(query: ListCandidatesQueryDto): Promise<CandidateListResult> {
    const qb = this.baseQuery('candidates');

    const firstName = normalizeSearch(query.first_name);
    if (firstName) {
      qb.andWhere('candidates.first_name ILIKE :firstName', {
        firstName: `%${firstName}%`,
      });
    }

    const lastName = normalizeSearch(query.last_name);
    if (lastName) {
      qb.andWhere('candidates.last_name ILIKE :lastName', {
        lastName: `%${lastName}%`,
      });
    }

    const email = String(query.email ?? '')
      .trim()
      .toLowerCase();
    if (email) {
      qb.andWhere('candidates.email ILIKE :email', { email: `%${email}%` });
    }

    const phone = String(query.phone ?? '').trim();
    if (phone) {
      qb.andWhere('candidates.phone = :phone', { phone });
    }

    if (query.source_type) {
      qb.andWhere('candidates.source_type = :sourceType', {
        sourceType: query.source_type,
      });
    }

    const location = normalizeSearch(query.current_location);
    if (location) {
      qb.andWhere('candidates.current_location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    if (typeof query.is_active === 'boolean') {
      qb.andWhere('candidates.is_active = :isActive', {
        isActive: query.is_active,
      });
    }

    if (typeof query.total_experience_years === 'number') {
      qb.andWhere('candidates.total_experience_years = :exp', {
        exp: query.total_experience_years,
      });
    }

    if (query.skill_id) {
      qb.innerJoin(
        'candidate_skills',
        'candidate_skills',
        'candidate_skills.candidate_id = candidates.id AND candidate_skills.deleted_at IS NULL AND candidate_skills.skill_id = :skillId',
        { skillId: query.skill_id },
      );
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    if (!CANDIDATE_SORTABLE_FIELDS.has(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`candidates.${sortBy}`, orderDirection);
    qb.addOrderBy('candidates.id', 'ASC');

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
        qb.andWhere('candidates.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('candidates.created_at > :cursorDate', { cursorDate });
      }

      const idRows = await qb
        .clone()
        .select(['candidates.id AS id', 'candidates.created_at AS created_at'])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('candidates')
            .andWhere('candidates.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is CandidateEntity => Boolean(d));

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
      .select('COUNT(DISTINCT candidates.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select(['candidates.id AS id', `candidates.${sortBy} AS sort_value`])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('candidates')
          .andWhere('candidates.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is CandidateEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}

const CANDIDATE_SORTABLE_FIELDS = new Set([
  'created_at',
  'updated_at',
  'first_name',
  'last_name',
  'email',
  'current_location',
  'total_experience_years',
  'is_active',
]);
