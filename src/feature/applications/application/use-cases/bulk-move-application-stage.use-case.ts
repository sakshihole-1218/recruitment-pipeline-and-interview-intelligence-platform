import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BulkMoveApplicationStageDto } from '../../dto/bulk-move-application-stage.dto';
import {
  BulkOperationFailureDto,
  BulkOperationResultResponseDto,
} from '../../dto/bulk-operation-result.response.dto';
import { ApplicationCurrentStage } from '../../enums/application-current-stage.enum';
import { ApplicationStatus } from '../../enums/application-status.enum';
import { ApplicationsValidationHelper } from '../../helpers/applications-validation.helper';
import { ApplicationRepository } from '../../repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../repositories/application-stage-history.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class BulkMoveApplicationStageUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly validationHelper: ApplicationsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    dto: BulkMoveApplicationStageDto,
    actorUserId?: string,
  ): Promise<BulkOperationResultResponseDto> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    const successfulIds: string[] = [];
    const failures: BulkOperationFailureDto[] = [];

    for (const applicationId of dto.application_ids) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const app = await this.applicationRepository.findById(applicationId, {
            manager,
          });
          if (!app) {
            throw new BadRequestException({
              message: 'Application not found',
              code: 'APPLICATION_NOT_FOUND',
            });
          }

          const fromStage = app.current_stage;
          const fromStatus = app.application_status;

          this.validationHelper.ensureNotTerminalStage(fromStage);

          let resumeFromStage: ApplicationCurrentStage | null = null;
          if (fromStage === ApplicationCurrentStage.ON_HOLD) {
            const latestHold =
              await this.stageHistoryRepository.findLatestHoldEntry({
                applicationId: app.id,
                manager,
              });
            resumeFromStage =
              (latestHold?.from_stage as ApplicationCurrentStage | null) ??
              null;
          }

          this.validationHelper.ensureStageTransitionAllowed({
            from: fromStage,
            to: dto.target_stage,
            resume_from_stage: resumeFromStage,
          });

          const now = new Date();

          app.current_stage = dto.target_stage;
          app.application_status = this.mapStatusFromStage(dto.target_stage);
          app.last_stage_changed_at = now;
          app.updated_by_user_id = actorUserId;

          if (dto.target_stage === ApplicationCurrentStage.REJECTED) {
            app.rejection_reason = dto.change_reason;
            app.withdrawal_reason = null;
          } else if (dto.target_stage === ApplicationCurrentStage.WITHDRAWN) {
            app.withdrawal_reason = dto.change_reason;
            app.rejection_reason = null;
          }

          await this.applicationRepository.save(app, { manager });

          await this.stageHistoryRepository.createAndSave(
            {
              application_id: app.id,
              from_stage: fromStage,
              to_stage: dto.target_stage,
              changed_by_user_id: actorUserId,
              change_reason: dto.change_reason,
              changed_at: now,
            },
            { manager },
          );

          await this.activityWriter.log(
            ActivityLogBuilder.build({
              entityType: ActivityEntityType.APPLICATION,
              entityId: app.id,
              actionType: ActivityActionType.STAGE_CHANGE,
              actorUserId,
              oldValues: {
                from_stage: fromStage,
                application_status: fromStatus,
              },
              newValues: {
                to_stage: dto.target_stage,
                application_status: app.application_status,
                reason_present: Boolean(dto.change_reason),
              },
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

  private mapStatusFromStage(
    stage: ApplicationCurrentStage,
  ): ApplicationStatus {
    if (stage === ApplicationCurrentStage.ON_HOLD)
      return ApplicationStatus.ON_HOLD;
    if (stage === ApplicationCurrentStage.REJECTED)
      return ApplicationStatus.REJECTED;
    if (stage === ApplicationCurrentStage.WITHDRAWN)
      return ApplicationStatus.WITHDRAWN;
    if (stage === ApplicationCurrentStage.HIRED) return ApplicationStatus.HIRED;
    return ApplicationStatus.ACTIVE;
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
