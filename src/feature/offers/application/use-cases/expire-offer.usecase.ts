import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { OfferEntity } from '../../entities/offer.entity';
import { OfferStatus } from '../../enums/offer-status.enum';
import { OffersValidationHelper } from '../../helpers/offers-validation.helper';
import { OfferRepository } from '../../repositories/offer.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class ExpireOfferUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly offersValidationHelper: OffersValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<OfferEntity> {
    this.offersValidationHelper.ensureActorUserRequired(actorUserId);

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
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
        'OFFER_EXPIRE_NOT_ALLOWED',
      );

      const oldOfferValues = {
        offer_status: offer.offer_status,
      };

      offer.offer_status = OfferStatus.EXPIRED;
      offer.updated_by_user_id = actorUserId ?? null;

      await this.offerRepository.save(offer, { manager });

      const loaded = await this.offerRepository.findById(offer.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'OFFER_POST_EXPIRE_LOAD_FAILED',
        });
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.OFFER,
          entityId: loaded.id,
          actionType: ActivityActionType.STATUS_CHANGE,
          actorUserId: actorUserId!,
          oldValues: oldOfferValues,
          newValues: { offer_status: loaded.offer_status },
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
