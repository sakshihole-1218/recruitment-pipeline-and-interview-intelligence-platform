import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UserRoleRepository } from '../../repositories/user-role.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class RemoveRoleFromUserUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(userId: string, roleId: string, actorUserId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
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

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.USER,
            entityId: userId,
            actionType: ActivityActionType.UPDATE,
            actorUserId,
            oldValues: { role_id: roleId, assigned: true },
            newValues: {
              role_id: roleId,
              assigned: false,
              changed_fields: ['roles'],
            },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }
    });
  }
}
