import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { MoveApplicationStageDto } from '../../dto/move-application-stage.dto';
import { ApplicationEntity } from '../../entities/application.entity';
import { ApplicationCurrentStage } from '../../enums/application-current-stage.enum';
import { ApplicationStatus } from '../../enums/application-status.enum';
import { ApplicationsValidationHelper } from '../../helpers/applications-validation.helper';
import { ApplicationRepository } from '../../repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../repositories/application-stage-history.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class MoveApplicationStageUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly validationHelper: ApplicationsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    applicationId: string,
    dto: MoveApplicationStageDto,
    actorUserId?: string,
  ): Promise<ApplicationEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    this.validationHelper.ensureMoveStageEndpointSupported(dto.to_stage);

    return this.dataSource.transaction(async (manager) => {
      const app = await this.applicationRepository.findById(applicationId, { manager });
      if (!app) {
        throw new NotFoundException({
          message: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      this.validationHelper.ensureNotTerminalStage(app.current_stage);

      const fromStage = app.current_stage;

      let resumeFromStage: ApplicationCurrentStage | null | undefined = undefined;
      if (app.current_stage === ApplicationCurrentStage.ON_HOLD) {
        const hold = await this.stageHistoryRepository.findLatestHoldEntry({
          applicationId: app.id,
          manager,
        });

        resumeFromStage = hold?.from_stage ?? null;
      }

      this.validationHelper.ensureStageTransitionAllowed({
        from: fromStage,
        to: dto.to_stage,
        resume_from_stage: resumeFromStage,
      });

      const now = new Date();

      const newStatus =
        dto.to_stage === ApplicationCurrentStage.HIRED
          ? ApplicationStatus.HIRED
          : ApplicationStatus.ACTIVE;

      app.current_stage = dto.to_stage;
      app.application_status = newStatus;
      app.last_stage_changed_at = now;
      app.updated_by_user_id = actorUserId;

      await this.applicationRepository.save(app, { manager });

      await this.stageHistoryRepository.createAndSave(
        {
          application_id: app.id,
          from_stage: fromStage,
          to_stage: dto.to_stage,
          changed_by_user_id: actorUserId,
          change_reason: dto.change_reason ?? null,
          changed_at: now,
        },
        { manager },
      );

      await this.activityWriter.log(
        ActivityLogBuilder.stageChange({
          entityType: ActivityEntityType.APPLICATION,
          entityId: app.id,
          fromStage,
          toStage: dto.to_stage,
          reason: dto.change_reason ?? null,
          actorUserId,
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      const loaded = await this.applicationRepository.findById(app.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'APPLICATION_POST_UPDATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
