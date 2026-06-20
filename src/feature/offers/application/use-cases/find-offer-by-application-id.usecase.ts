import { Injectable, NotFoundException } from '@nestjs/common';

import { OfferEntity } from '../../entities/offer.entity';
import { OfferRepository } from '../../repositories/offer.repository';

@Injectable()
export class FindOfferByApplicationIdUseCase {
  constructor(private readonly offerRepository: OfferRepository) {}

  async execute(applicationId: string): Promise<OfferEntity> {
    const offer =
      await this.offerRepository.findLatestByApplicationId(applicationId);
    if (!offer) {
      throw new NotFoundException({
        message: 'Offer not found for application',
        code: 'OFFER_NOT_FOUND_FOR_APPLICATION',
      });
    }
    return offer;
  }
}
