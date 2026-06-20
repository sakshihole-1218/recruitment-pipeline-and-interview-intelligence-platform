import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { OfferEntity } from '../../entities/offer.entity';
import { OfferRepository } from '../../repositories/offer.repository';
import { OffersValidationHelper } from '../../helpers/offers-validation.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class SoftDeleteOfferUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly offersValidationHelper: OffersValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    this.offersValidationHelper.ensureActorUserRequired(actorUserId);

    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const offer = await this.offerRepository.findById(id, { manager });
      if (!offer) {
        throw new NotFoundException({
          message: 'Offer not found',
          code: 'OFFER_NOT_FOUND',
        });
      }

      await manager
        .getRepository(OfferEntity)
        .createQueryBuilder()
        .update(OfferEntity)
        .set({
          deleted_at: now,
          deleted_by_user_id: actorUserId ?? null,
          updated_at: now,
          updated_by_user_id: actorUserId ?? null,
        })
        .where('id = :id', { id })
        .andWhere('deleted_at IS NULL')
        .execute();

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.OFFER,
          entityId: offer.id,
          actionType: ActivityActionType.DELETE,
          actorUserId: actorUserId,
          oldValues: { deleted_at: null },
          newValues: { deleted_at: now.toISOString() },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );
    });
  }
}
