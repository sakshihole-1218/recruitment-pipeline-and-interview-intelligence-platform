import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CompleteApplicationScreeningDto } from '../../dto/complete-application-screening.dto';
import { ApplicationEntity } from '../../entities/application.entity';
import { ApplicationCurrentStage } from '../../enums/application-current-stage.enum';
import { ApplicationStatus } from '../../enums/application-status.enum';
import { ScreeningResult } from '../../enums/screening-result.enum';
import { ApplicationStageHistoryRepository } from '../../repositories/application-stage-history.repository';
import { ApplicationRepository } from '../../repositories/application.repository';
import { ApplicationScreeningValidationHelper } from '../../helpers/application-screening-validation.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CompleteApplicationScreeningUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly screeningValidation: ApplicationScreeningValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    applicationId: string,
    dto: CompleteApplicationScreeningDto,
    actorUserId?: string,
  ): Promise<ApplicationEntity> {
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

      this.screeningValidation.ensureCanCompleteScreening(app.current_stage);

      this.screeningValidation.ensureScoreInRange({
        field: 'screening_score',
        value: dto.screening_score,
        min: 0,
        max: 100,
      });
      this.screeningValidation.ensureScoreInRange({
        field: 'fit_score',
        value: dto.fit_score,
        min: 0,
        max: 100,
      });

      const fromStage = app.current_stage;
      const fromStatus = app.application_status;

      const remarks = dto.screening_remarks?.trim() || null;

      let toStage: ApplicationCurrentStage;
      let toStatus: ApplicationStatus;

      if (dto.screening_result === ScreeningResult.SHORTLISTED) {
        toStage = ApplicationCurrentStage.SHORTLISTED;
        toStatus = ApplicationStatus.ACTIVE;
      } else if (dto.screening_result === ScreeningResult.REJECTED) {
        toStage = ApplicationCurrentStage.REJECTED;
        toStatus = ApplicationStatus.REJECTED;
      } else {
        toStage = ApplicationCurrentStage.ON_HOLD;
        toStatus = ApplicationStatus.ON_HOLD;
      }

      app.current_stage = toStage;
      app.application_status = toStatus;
      app.screening_score = Number(dto.screening_score).toFixed(2);
      app.fit_score = Number(dto.fit_score).toFixed(2);
      app.last_stage_changed_at = now;
      app.updated_by_user_id = actorUserId;

      if (toStage === ApplicationCurrentStage.REJECTED) {
        app.rejection_reason = remarks;
        app.withdrawal_reason = null;
      } else {
        app.rejection_reason = null;
      }

      await this.applicationRepository.save(app, { manager });

      await this.stageHistoryRepository.createAndSave(
        {
          application_id: app.id,
          from_stage: fromStage,
          to_stage: toStage,
          changed_by_user_id: actorUserId,
          change_reason: remarks,
          changed_at: now,
        },
        { manager },
      );

      const loaded = await this.applicationRepository.findById(app.id, {
        manager,
      });
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
            reason_present: Boolean(remarks),
            screening_result: dto.screening_result,
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
