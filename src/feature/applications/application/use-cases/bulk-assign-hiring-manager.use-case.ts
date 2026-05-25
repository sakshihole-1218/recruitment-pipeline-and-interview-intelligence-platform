import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BulkAssignHiringManagerDto } from '../../dto/bulk-assign-hiring-manager.dto';
import { BulkOperationFailureDto, BulkOperationResultResponseDto } from '../../dto/bulk-operation-result.response.dto';
import { ApplicationRepository } from '../../repositories/application.repository';
import { ApplicationReferenceRepository } from '../../repositories/application-reference.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class BulkAssignHiringManagerUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly referenceRepository: ApplicationReferenceRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(dto: BulkAssignHiringManagerDto, actorUserId?: string): Promise<BulkOperationResultResponseDto> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    const hmExists = await this.dataSource.transaction((manager) =>
      this.referenceRepository.userExists(dto.hiring_manager_user_id, manager),
    );

    if (!hmExists) {
      throw new BadRequestException({
        message: 'Hiring manager user not found',
        code: 'HIRING_MANAGER_NOT_FOUND',
      });
    }

    const successfulIds: string[] = [];
    const failures: BulkOperationFailureDto[] = [];

    for (const applicationId of dto.application_ids) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const app = await this.applicationRepository.findById(applicationId, { manager });
          if (!app) {
            throw new BadRequestException({
              message: 'Application not found',
              code: 'APPLICATION_NOT_FOUND',
            });
          }

          const now = new Date();
          const oldHmId = app.assigned_hiring_manager_user_id;

          app.assigned_hiring_manager_user_id = dto.hiring_manager_user_id;
          app.updated_by_user_id = actorUserId;

          await this.applicationRepository.save(app, { manager });

          await this.activityWriter.log(
            ActivityLogBuilder.build({
              entityType: ActivityEntityType.APPLICATION,
              entityId: app.id,
              actionType: ActivityActionType.UPDATE,
              actorUserId,
              oldValues: { assigned_hiring_manager_user_id: oldHmId },
              newValues: { assigned_hiring_manager_user_id: dto.hiring_manager_user_id },
              actionAt: now,
              ipAddress: null,
              userAgent: null,
            }),
            { manager },
          );
        });

        successfulIds.push(applicationId);
      } catch (error) {
        failures.push({
          application_id: applicationId,
          reason: this.extractErrorReason(error),
        });
      }
    }

    return {
      success_count: successfulIds.length,
      failed_count: failures.length,
      successful_ids: successfulIds,
      failures,
    };
  }

  private extractErrorReason(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object') {
        const message = (response as any).message;
        if (typeof message === 'string') return message;
        if (Array.isArray(message) && message.length) return String(message[0]);
      }
      return error.message;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }

    return 'Unable to process record';
  }
}
