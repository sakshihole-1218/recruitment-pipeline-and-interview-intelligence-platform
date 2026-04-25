import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';

import { UserRoleEntity } from '../entities/user-role.entity';

@Injectable()
export class UserRoleRepository {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly repository: Repository<UserRoleEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<UserRoleEntity> {
    return manager ? manager.getRepository(UserRoleEntity) : this.repository;
  }

  async findAnyByUserAndRole(
    userId: string,
    roleId: string,
    options?: { manager?: EntityManager },
  ): Promise<UserRoleEntity | null> {
    return this.repo(options?.manager).findOne({
      where: { user_id: userId, role_id: roleId },
      withDeleted: true,
      relations: ['role'],
    });
  }

  async findActiveByUserAndRole(
    userId: string,
    roleId: string,
    options?: { manager?: EntityManager },
  ): Promise<UserRoleEntity | null> {
    return this.repo(options?.manager).findOne({
      where: { user_id: userId, role_id: roleId, deleted_at: IsNull() },
      relations: ['role'],
    });
  }

  async createAndSave(
    payload: Partial<UserRoleEntity>,
    options?: { manager?: EntityManager },
  ): Promise<UserRoleEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async save(
    entity: UserRoleEntity,
    options?: { manager?: EntityManager },
  ): Promise<UserRoleEntity> {
    return this.repo(options?.manager).save(entity);
  }
}
