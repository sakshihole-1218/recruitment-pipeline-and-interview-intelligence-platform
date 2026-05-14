import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { WithdrawApplicationDto } from '../../dto/withdraw-application.dto';
import { ApplicationEntity } from '../../entities/application.entity';
import { ApplicationCurrentStage } from '../../enums/application-current-stage.enum';
import { ApplicationStatus } from '../../enums/application-status.enum';
import { ApplicationsValidationHelper } from '../../helpers/applications-validation.helper';
import { ApplicationRepository } from '../../repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../repositories/application-stage-history.repository';

@Injectable()
export class WithdrawApplicationUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly validationHelper: ApplicationsValidationHelper,
  ) {}

  async execute(
    applicationId: string,
    dto: WithdrawApplicationDto,
    actorUserId?: string,
  ): Promise<ApplicationEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const app = await this.applicationRepository.findById(applicationId, { manager });
      if (!app) {
        throw new NotFoundException({
          message: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      const fromStage = app.current_stage;

      if (app.current_stage === ApplicationCurrentStage.WITHDRAWN) {
        throw new ConflictException({
          message: 'Application is already withdrawn',
          code: 'APPLICATION_ALREADY_WITHDRAWN',
        });
      }

      this.validationHelper.ensureStageTransitionAllowed({
        from: fromStage,
        to: ApplicationCurrentStage.WITHDRAWN,
      });

      const now = new Date();

      app.current_stage = ApplicationCurrentStage.WITHDRAWN;
      app.application_status = ApplicationStatus.WITHDRAWN;
      app.withdrawal_reason = dto.withdrawal_reason;
      app.rejection_reason = null;
      app.last_stage_changed_at = now;
      app.updated_by_user_id = actorUserId;

      await this.applicationRepository.save(app, { manager });

      await this.stageHistoryRepository.createAndSave(
        {
          application_id: app.id,
          from_stage: fromStage,
          to_stage: ApplicationCurrentStage.WITHDRAWN,
          changed_by_user_id: actorUserId,
          change_reason: dto.withdrawal_reason,
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

      return loaded;
    });
  }
}
