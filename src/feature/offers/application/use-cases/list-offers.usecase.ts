import { Injectable } from '@nestjs/common';

import { ListOffersQueryDto } from '../../dto/list-offers.query.dto';
import { OffersPaginationHelper } from '../../helpers/offers-pagination.helper';
import { OfferRepository } from '../../repositories/offer.repository';

@Injectable()
export class ListOffersUseCase {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly paginationHelper: OffersPaginationHelper,
  ) {}

  async execute(query: ListOffersQueryDto) {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });

    return this.offerRepository.list(query);
  }
}
