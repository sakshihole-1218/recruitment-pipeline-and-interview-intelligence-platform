import { Injectable, NotFoundException } from '@nestjs/common';

import { RoleEntity } from '../../entities/role.entity';
import { RoleRepository } from '../../repositories/role.repository';

@Injectable()
export class FindRoleByIdUseCase {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findById(id);

    if (!role || role.deleted_at) {
      throw new NotFoundException({
        message: 'Role not found',
        code: 'ROLE_NOT_FOUND',
      });
    }

    return role;
  }
}
