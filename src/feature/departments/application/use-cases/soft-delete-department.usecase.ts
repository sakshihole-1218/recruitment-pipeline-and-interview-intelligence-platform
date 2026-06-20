import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { DepartmentRepository } from '../../repositories/department.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class SoftDeleteDepartmentUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly departmentRepository: DepartmentRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const department = await this.departmentRepository.findById(id, {
        manager,
      });

      if (!department) {
        throw new NotFoundException({
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND',
        });
      }

      department.deleted_at = now;
      department.deleted_by_user_id = actorUserId ?? null;
      department.updated_by_user_id =
        actorUserId ?? department.updated_by_user_id;

      await this.departmentRepository.save(department, { manager });

      const loaded = await this.departmentRepository.findById(id, { manager });
      if (loaded) {
        throw new ConflictException({
          message: 'We could not delete the department. Please try again',
          code: 'DEPARTMENT_SOFT_DELETE_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.DEPARTMENT,
            entityId: department.id,
            actionType: ActivityActionType.DELETE,
            actorUserId,
            oldValues: { deleted_at: null },
            newValues: { deleted_at: now.toISOString() },
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
