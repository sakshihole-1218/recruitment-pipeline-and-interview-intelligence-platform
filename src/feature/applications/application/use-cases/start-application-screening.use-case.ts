import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationEntity } from '../../entities/application.entity';
import { ApplicationCurrentStage } from '../../enums/application-current-stage.enum';
import { ApplicationStatus } from '../../enums/application-status.enum';
import { ApplicationStageHistoryRepository } from '../../repositories/application-stage-history.repository';
import { ApplicationRepository } from '../../repositories/application.repository';
import { ApplicationScreeningValidationHelper } from '../../helpers/application-screening-validation.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class StartApplicationScreeningUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly screeningValidation: ApplicationScreeningValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(applicationId: string, actorUserId?: string): Promise<ApplicationEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const app = await manager
        .getRepository(ApplicationEntity)
        .createQueryBuilder('applications')
        .where('applications.id = :id', { id: applicationId })
        .andWhere('applications.deleted_at IS NULL')
        .setLock('pessimistic_write')
        .getOne();

      if (!app) {
        throw new NotFoundException({
          message: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      this.screeningValidation.ensureCanStartScreening(app.current_stage);

      const fromStage = app.current_stage;
      const fromStatus = app.application_status;

      app.current_stage = ApplicationCurrentStage.SCREENING;
      app.application_status = ApplicationStatus.ACTIVE;
      app.last_stage_changed_at = now;
      app.updated_by_user_id = actorUserId;

      await this.applicationRepository.save(app, { manager });

      await this.stageHistoryRepository.createAndSave(
        {
          application_id: app.id,
          from_stage: fromStage,
          to_stage: ApplicationCurrentStage.SCREENING,
          changed_by_user_id: actorUserId,
          change_reason: 'Screening started',
          changed_at: now,
        },
        { manager },
      );

      const loaded = await this.applicationRepository.findById(app.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'APPLICATION_POST_UPDATE_LOAD_FAILED',
        });
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.APPLICATION,
          entityId: loaded.id,
          actionType: ActivityActionType.STAGE_CHANGE,
          actorUserId,
          oldValues: {
            from_stage: fromStage,
            application_status: fromStatus,
          },
          newValues: {
            to_stage: loaded.current_stage,
            application_status: loaded.application_status,
            reason_present: true,
          },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      return loaded;
    });
  }
}
