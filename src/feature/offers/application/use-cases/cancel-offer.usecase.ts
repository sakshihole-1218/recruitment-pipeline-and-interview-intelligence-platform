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

@Injectable()
export class CancelOfferUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly offersValidationHelper: OffersValidationHelper,
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
        [OfferStatus.DRAFT, OfferStatus.SENT],
        'OFFER_CANCEL_NOT_ALLOWED',
      );

      offer.offer_status = OfferStatus.CANCELLED;
      offer.updated_by_user_id = actorUserId ?? null;

      await this.offerRepository.save(offer, { manager });

      const loaded = await this.offerRepository.findById(offer.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'OFFER_POST_CANCEL_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
