import { Injectable, NotFoundException } from '@nestjs/common';

import { OfferEntity } from '../../entities/offer.entity';
import { OfferRepository } from '../../repositories/offer.repository';

@Injectable()
export class FindOfferByIdUseCase {
  constructor(private readonly offerRepository: OfferRepository) {}

  async execute(id: string): Promise<OfferEntity> {
    const offer = await this.offerRepository.findById(id);
    if (!offer) {
      throw new NotFoundException({
        message: 'Offer not found',
        code: 'OFFER_NOT_FOUND',
      });
    }
    return offer;
  }
}
