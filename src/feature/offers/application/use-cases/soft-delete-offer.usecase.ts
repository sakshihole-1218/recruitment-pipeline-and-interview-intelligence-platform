import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { OfferEntity } from '../../entities/offer.entity';
import { OfferRepository } from '../../repositories/offer.repository';
import { OffersValidationHelper } from '../../helpers/offers-validation.helper';

@Injectable()
export class SoftDeleteOfferUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly offersValidationHelper: OffersValidationHelper,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    this.offersValidationHelper.ensureActorUserRequired(actorUserId);

    await this.dataSource.transaction(async (manager) => {
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
          deleted_at: () => 'CURRENT_TIMESTAMP',
          deleted_by_user_id: actorUserId ?? null,
          updated_at: () => 'CURRENT_TIMESTAMP',
          updated_by_user_id: actorUserId ?? null,
        })
        .where('id = :id', { id })
        .andWhere('deleted_at IS NULL')
        .execute();
    });
  }
}
