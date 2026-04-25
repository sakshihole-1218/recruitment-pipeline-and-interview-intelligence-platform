import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UserRoleEntity } from '../../entities/user-role.entity';
import { RoleRepository } from '../../repositories/role.repository';
import { UserRepository } from '../../repositories/user.repository';
import { UserRoleRepository } from '../../repositories/user-role.repository';

@Injectable()
export class AssignRoleToUserUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async execute(userId: string, roleId: string): Promise<UserRoleEntity> {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.userRepository.findById(userId, { manager });
      if (!user) {
        throw new NotFoundException({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      const role = await this.roleRepository.findById(roleId, { manager });
      if (!role || role.deleted_at) {
        throw new NotFoundException({
          message: 'Role not found',
          code: 'ROLE_NOT_FOUND',
        });
      }

      const existing = await this.userRoleRepository.findAnyByUserAndRole(
        userId,
        roleId,
        { manager },
      );

      if (existing && !existing.deleted_at) {
        throw new ConflictException({
          message: 'Role already assigned to user',
          code: 'DUPLICATE_ROLE_ASSIGNMENT',
        });
      }

      if (existing && existing.deleted_at) {
        existing.deleted_at = null;
        const restored = await this.userRoleRepository.save(existing, { manager });
        restored.role = role;
        return restored;
      }

      const created = await this.userRoleRepository.createAndSave(
        {
          user_id: userId,
          role_id: roleId,
          deleted_at: null,
        },
        { manager },
      );

      created.role = role;
      return created;
    });
  }
}
