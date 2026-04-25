import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListRolesQueryDto } from '../dto/list-roles.query.dto';
import { RoleEntity } from '../entities/role.entity';
import { normalizeSearch } from '../../../common/utils/normalization.util';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<RoleEntity> {
    return manager ? manager.getRepository(RoleEntity) : this.repository;
  }

  private baseQuery(alias = 'roles'): SelectQueryBuilder<RoleEntity> {
    return this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(id: string, options?: { manager?: EntityManager }) {
    return this.repo(options?.manager).findOne({
      where: { id },
    });
  }

  async findByCode(
    code: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<RoleEntity | null> {
    return this.repo(options?.manager).findOne({
      where: { code },
      withDeleted: options?.includeDeleted ?? false,
    });
  }

  async list(query: ListRolesQueryDto): Promise<{
    data: RoleEntity[];
    page: number;
    limit: number;
    total_records: number;
  }> {
    const qb = this.baseQuery('roles');

    const search = normalizeSearch(query.search);
    if (search) {
      qb.andWhere(
        '(roles.name ILIKE :search OR roles.code ILIKE :search OR roles.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    qb.orderBy(`roles.${query.sort_by || 'created_at'}`, orderDirection);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
