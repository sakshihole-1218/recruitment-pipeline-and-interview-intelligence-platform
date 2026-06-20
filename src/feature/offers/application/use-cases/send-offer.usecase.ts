import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationEntity } from '../../../applications/entities/application.entity';
import { ApplicationCurrentStage } from '../../../applications/enums/application-current-stage.enum';
import { ApplicationRepository } from '../../../applications/repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../../applications/repositories/application-stage-history.repository';
import { ApplicationsValidationHelper } from '../../../applications/helpers/applications-validation.helper';
import { OfferEntity } from '../../entities/offer.entity';
import { OfferStatus } from '../../enums/offer-status.enum';
import { OffersValidationHelper } from '../../helpers/offers-validation.helper';
import { OfferRepository } from '../../repositories/offer.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class SendOfferUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly applicationsValidationHelper: ApplicationsValidationHelper,
    private readonly offersValidationHelper: OffersValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<OfferEntity> {
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
        [OfferStatus.DRAFT],
        'OFFER_SEND_NOT_ALLOWED',
      );

      this.offersValidationHelper.ensureExpectedJoiningDateFuture(
        offer.expected_joining_date,
      );

      const now = new Date();

      const oldOfferValues = {
        offer_status: offer.offer_status,
        offered_at: offer.offered_at ? offer.offered_at.toISOString() : null,
      };

      offer.offer_status = OfferStatus.SENT;
      offer.offered_at = now;
      offer.updated_by_user_id = actorUserId;

      await this.offerRepository.save(offer, { manager });

      const app = await this.applicationRepository.findById(
        offer.application_id,
        {
          manager,
        },
      );
      if (!app) {
        throw new ConflictException({
          message: 'Offer is linked to an invalid application',
          code: 'OFFER_APPLICATION_INVALID',
        });
      }

      this.applicationsValidationHelper.ensureNotTerminalStage(
        app.current_stage,
      );

      if (app.current_stage !== ApplicationCurrentStage.OFFER) {
        this.applicationsValidationHelper.ensureStageTransitionAllowed({
          from: app.current_stage,
          to: ApplicationCurrentStage.OFFER,
        });

        const fromStage = app.current_stage;
        app.current_stage = ApplicationCurrentStage.OFFER;
        app.last_stage_changed_at = now;
        app.updated_by_user_id = actorUserId;

        await manager.getRepository(ApplicationEntity).save(app);

        await this.stageHistoryRepository.createAndSave(
          {
            application_id: app.id,
            from_stage: fromStage,
            to_stage: ApplicationCurrentStage.OFFER,
            changed_by_user_id: actorUserId,
            change_reason: 'Offer sent',
            changed_at: now,
          },
          { manager },
        );

        await this.activityWriter.log(
          ActivityLogBuilder.stageChange({
            entityType: ActivityEntityType.APPLICATION,
            entityId: app.id,
            fromStage,
            toStage: ApplicationCurrentStage.OFFER,
            reason: 'Offer sent',
            actorUserId: actorUserId,
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      const loaded = await this.offerRepository.findById(offer.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'OFFER_POST_SEND_LOAD_FAILED',
        });
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.OFFER,
          entityId: loaded.id,
          actionType: ActivityActionType.SEND,
          actorUserId: actorUserId,
          oldValues: oldOfferValues,
          newValues: {
            offer_status: loaded.offer_status,
            offered_at: loaded.offered_at
              ? loaded.offered_at.toISOString()
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
