import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UserRoleRepository } from '../../repositories/user-role.repository';

@Injectable()
export class RemoveRoleFromUserUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async execute(userId: string, roleId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const assignment = await this.userRoleRepository.findActiveByUserAndRole(
        userId,
        roleId,
        { manager },
      );

      if (!assignment) {
        throw new NotFoundException({
          message: 'Role assignment not found',
          code: 'USER_ROLE_NOT_FOUND',
        });
      }

      assignment.deleted_at = new Date();
      await this.userRoleRepository.save(assignment, { manager });
    });
  }
}
