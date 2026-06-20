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
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class AssignRoleToUserUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    userId: string,
    roleId: string,
    actorUserId: string,
  ): Promise<UserRoleEntity> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
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
        const restored = await this.userRoleRepository.save(existing, {
          manager,
        });
        restored.role = role;

        if (actorUserId) {
          await this.activityWriter.log(
            ActivityLogBuilder.build({
              entityType: ActivityEntityType.USER,
              entityId: userId,
              actionType: ActivityActionType.UPDATE,
              actorUserId,
              oldValues: { role_id: roleId, assigned: false },
              newValues: {
                role_id: roleId,
                role_code: role.code,
                assigned: true,
                changed_fields: ['roles'],
              },
              actionAt: now,
              ipAddress: null,
              userAgent: null,
            }),
            { manager },
          );
        }

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

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.USER,
            entityId: userId,
            actionType: ActivityActionType.UPDATE,
            actorUserId,
            oldValues: { role_id: roleId, assigned: false },
            newValues: {
              role_id: roleId,
              role_code: role.code,
              assigned: true,
              changed_fields: ['roles'],
            },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      return created;
    });
  }
}
