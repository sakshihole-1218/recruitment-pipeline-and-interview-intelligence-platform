import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateDepartmentStatusDto } from '../../dto/update-department-status.dto';
import { DepartmentEntity } from '../../entities/department.entity';
import { DepartmentRepository } from '../../repositories/department.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class UpdateDepartmentStatusUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly departmentRepository: DepartmentRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    id: string,
    dto: UpdateDepartmentStatusDto,
    actorUserId?: string,
  ): Promise<DepartmentEntity> {
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

      const oldIsActive = department.is_active;
      department.is_active = dto.is_active;
      if (actorUserId) {
        department.updated_by_user_id = actorUserId;
      }

      await this.departmentRepository.save(department, { manager });

      const updated = await this.departmentRepository.findById(department.id, {
        manager,
      });

      if (!updated) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'DEPARTMENT_POST_UPDATE_LOAD_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.DEPARTMENT,
            entityId: updated.id,
            actionType: ActivityActionType.STATUS_CHANGE,
            actorUserId,
            oldValues: { is_active: oldIsActive },
            newValues: { is_active: updated.is_active },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      return updated;
    });
  }
}
