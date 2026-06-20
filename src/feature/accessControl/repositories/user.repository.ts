import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListUsersQueryDto } from '../dto/list-users.query.dto';
import { UserEntity } from '../entities/user.entity';
import {
  normalizeEmail,
  normalizeSearch,
} from '../../../common/utils/normalization.util';

export type UserListResult =
  | {
      mode: 'offset';
      data: UserEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: UserEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<UserEntity> {
    return manager ? manager.getRepository(UserEntity) : this.repository;
  }

  private baseQuery(
    alias = 'users',
    manager?: EntityManager,
  ): SelectQueryBuilder<UserEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .leftJoinAndSelect(
        `${alias}.user_roles`,
        'user_roles',
        'user_roles.deleted_at IS NULL',
      )
      .leftJoinAndSelect('user_roles.role', 'roles', 'roles.deleted_at IS NULL')
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<UserEntity | null> {
    return this.baseQuery('users', options?.manager)
      .andWhere('users.id = :id', { id })
      .getOne();
  }

  async findByEmail(
    email: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<UserEntity | null> {
    const normalizedEmail = normalizeEmail(email);
    return this.findByNormalizedEmail(normalizedEmail, options);
  }

  async findByEmailWithRoles(
    email: string,
    options?: { manager?: EntityManager },
  ): Promise<UserEntity | null> {
    const normalizedEmail = normalizeEmail(email);
    return this.baseQuery('users', options?.manager)
      .andWhere('users.email = :email', { email: normalizedEmail })
      .getOne();
  }

  async findByNormalizedEmail(
    normalizedEmail: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<UserEntity | null> {
    const repo = this.repo(options?.manager);

    return repo.findOne({
      where: { email: normalizedEmail },
      withDeleted: options?.includeDeleted ?? false,
    });
  }

  async save(
    user: UserEntity,
    options?: { manager?: EntityManager },
  ): Promise<UserEntity> {
    return this.repo(options?.manager).save(user);
  }

  async createAndSave(
    payload: Partial<UserEntity>,
    options?: { manager?: EntityManager },
  ): Promise<UserEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async list(query: ListUsersQueryDto): Promise<UserListResult> {
    const qb = this.baseQuery('users');

    const search = normalizeSearch(query.search);
    if (search) {
      qb.andWhere(
        '(users.first_name ILIKE :search OR users.last_name ILIKE :search OR users.email ILIKE :search OR users.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (typeof query.is_active === 'boolean') {
      qb.andWhere('users.is_active = :isActive', { isActive: query.is_active });
    }

    if (query.role_code) {
      qb.andWhere('roles.code = :roleCode', { roleCode: query.role_code });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';
    qb.orderBy(`users.${sortBy}`, orderDirection);
    qb.addOrderBy('users.id', 'ASC');

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
        qb.andWhere('users.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('users.created_at > :cursorDate', { cursorDate });
      }

      const idRows = await qb
        .clone()
        .select(['users.id AS id', 'users.created_at AS created_at'])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const users = ids.length
        ? await this.baseQuery('users')
            .andWhere('users.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const usersById = new Map(users.map((u) => [u.id, u] as const));
      const results = ids
        .map((id) => usersById.get(id))
        .filter((u): u is UserEntity => Boolean(u));

      const nextCursor = hasMore
        ? pageRows[pageRows.length - 1]?.created_at
          ? new Date(pageRows[pageRows.length - 1].created_at).toISOString()
          : null
        : null;

      return {
        mode: 'cursor',
        data: results,
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
      .select('COUNT(DISTINCT users.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idSelect = qb.clone();

    const idRows = await idSelect
      .select(['users.id AS id', `users.${sortBy} AS sort_value`])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const users = ids.length
      ? await this.baseQuery('users')
          .andWhere('users.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const usersById = new Map(users.map((u) => [u.id, u] as const));
    const data = ids
      .map((id) => usersById.get(id))
      .filter((u): u is UserEntity => Boolean(u));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
