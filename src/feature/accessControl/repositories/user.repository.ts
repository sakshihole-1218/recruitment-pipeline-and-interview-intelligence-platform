import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListUsersQueryDto } from '../dto/list-users.query.dto';
import { UserEntity } from '../entities/user.entity';
import { normalizeEmail, normalizeSearch } from '../../../common/utils/normalization.util';

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
      .leftJoinAndSelect(
        'user_roles.role',
        'roles',
        'roles.deleted_at IS NULL',
      )
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
    qb.orderBy(`users.${query.sort_by || 'created_at'}`, orderDirection);

    const limit = query.limit || 10;

    if (query.cursor) {
      const cursorDate = new Date(query.cursor);

      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException({
          message: 'Invalid cursor. Expected ISO timestamp.',
          code: 'INVALID_CURSOR',
        });
      }

      if (orderDirection === 'DESC') {
        qb.andWhere('users.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('users.created_at > :cursorDate', { cursorDate });
      }

      const data = await qb.take(limit + 1).getMany();
      const hasMore = data.length > limit;
      const results = hasMore ? data.slice(0, limit) : data;
      const nextCursor = hasMore
        ? results[results.length - 1]?.created_at?.toISOString() ?? null
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
