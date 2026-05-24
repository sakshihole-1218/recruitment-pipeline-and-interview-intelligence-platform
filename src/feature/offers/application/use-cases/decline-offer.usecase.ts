import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationCurrentStage } from '../../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../../applications/enums/application-status.enum';
import { ApplicationRepository } from '../../../applications/repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../../applications/repositories/application-stage-history.repository';
import { ApplicationsValidationHelper } from '../../../applications/helpers/applications-validation.helper';
import { DeclineOfferDto } from '../../dto/decline-offer.dto';
import { OfferEntity } from '../../entities/offer.entity';
import { OfferStatus } from '../../enums/offer-status.enum';
import { OffersValidationHelper } from '../../helpers/offers-validation.helper';
import { OfferRepository } from '../../repositories/offer.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class DeclineOfferUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly applicationsValidationHelper: ApplicationsValidationHelper,
    private readonly offersValidationHelper: OffersValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, dto: DeclineOfferDto, actorUserId?: string): Promise<OfferEntity> {
    this.offersValidationHelper.ensureActorUserRequired(actorUserId);

    return this.dataSource.transaction(async (manager) => {
      const offer = await this.offerRepository.findById(id, { manager });
      if (!offer) {
        throw new NotFoundException({
          message: 'Offer not found',
          code: 'OFFER_NOT_FOUND',
        });
      }

      this.offersValidationHelper.ensureStatusIn(
        offer,
        [OfferStatus.SENT],
        'OFFER_DECLINE_NOT_ALLOWED',
      );

      const now = new Date();

      const oldOfferValues = {
        offer_status: offer.offer_status,
        declined_at: offer.declined_at ? offer.declined_at.toISOString() : null,
      };
      offer.offer_status = OfferStatus.DECLINED;
      offer.declined_at = now;
      offer.decline_reason = dto.decline_reason;
      offer.updated_by_user_id = actorUserId ?? null;

      await this.offerRepository.save(offer, { manager });

      const app = await this.applicationRepository.findById(offer.application_id, {
        manager,
      });
      if (!app) {
        throw new ConflictException({
          message: 'Offer is linked to an invalid application',
          code: 'OFFER_APPLICATION_INVALID',
        });
      }

      this.applicationsValidationHelper.ensureNotTerminalStage(app.current_stage);

      const targetStage = ApplicationCurrentStage.REJECTED;
      const fromStage = app.current_stage;

      if (fromStage !== targetStage) {
        this.applicationsValidationHelper.ensureStageTransitionAllowed({
          from: fromStage,
          to: targetStage,
        });

        await this.stageHistoryRepository.createAndSave(
          {
            application_id: app.id,
            from_stage: fromStage,
            to_stage: targetStage,
            changed_by_user_id: actorUserId!,
            change_reason: dto.decline_reason,
            changed_at: now,
          },
          { manager },
        );

        app.current_stage = targetStage;
        app.last_stage_changed_at = now;

        await this.activityWriter.log(
          ActivityLogBuilder.stageChange({
            entityType: ActivityEntityType.APPLICATION,
            entityId: app.id,
            fromStage,
            toStage: targetStage,
            reason: dto.decline_reason,
            actorUserId: actorUserId!,
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      app.application_status = ApplicationStatus.REJECTED;
      app.rejection_reason = dto.decline_reason;
      app.withdrawal_reason = null;
      app.updated_by_user_id = actorUserId ?? null;
      await this.applicationRepository.save(app, { manager });

      const loaded = await this.offerRepository.findById(offer.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'OFFER_POST_DECLINE_LOAD_FAILED',
        });
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.OFFER,
          entityId: loaded.id,
          actionType: ActivityActionType.DECLINE,
          actorUserId: actorUserId!,
          oldValues: oldOfferValues,
          newValues: {
            offer_status: loaded.offer_status,
            declined_at: loaded.declined_at
              ? loaded.declined_at.toISOString()
              : null,
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
