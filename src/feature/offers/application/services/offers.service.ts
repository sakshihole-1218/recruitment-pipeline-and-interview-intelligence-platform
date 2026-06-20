import { Injectable } from '@nestjs/common';

import { CreateOfferDto } from '../../dto/create-offer.dto';
import { UpdateOfferDto } from '../../dto/update-offer.dto';
import { ListOffersQueryDto } from '../../dto/list-offers.query.dto';
import { DeclineOfferDto } from '../../dto/decline-offer.dto';

import { CreateOfferUseCase } from '../use-cases/create-offer.usecase';
import { UpdateOfferUseCase } from '../use-cases/update-offer.usecase';
import { FindOfferByIdUseCase } from '../use-cases/find-offer-by-id.usecase';
import { FindOfferByApplicationIdUseCase } from '../use-cases/find-offer-by-application-id.usecase';
import { ListOffersUseCase } from '../use-cases/list-offers.usecase';
import { SendOfferUseCase } from '../use-cases/send-offer.usecase';
import { AcceptOfferUseCase } from '../use-cases/accept-offer.usecase';
import { DeclineOfferUseCase } from '../use-cases/decline-offer.usecase';
import { CancelOfferUseCase } from '../use-cases/cancel-offer.usecase';
import { ExpireOfferUseCase } from '../use-cases/expire-offer.usecase';
import { SoftDeleteOfferUseCase } from '../use-cases/soft-delete-offer.usecase';
import { BulkSendOffersUseCase } from '../use-cases/bulk-send-offers.usecase';
import { BulkExpireOffersUseCase } from '../use-cases/bulk-expire-offers.usecase';
import { BulkCancelOffersUseCase } from '../use-cases/bulk-cancel-offers.usecase';

@Injectable()
export class OffersService {
  constructor(
    private readonly createUseCase: CreateOfferUseCase,
    private readonly updateUseCase: UpdateOfferUseCase,
    private readonly findByIdUseCase: FindOfferByIdUseCase,
    private readonly findByApplicationIdUseCase: FindOfferByApplicationIdUseCase,
    private readonly listUseCase: ListOffersUseCase,
    private readonly sendUseCase: SendOfferUseCase,
    private readonly acceptUseCase: AcceptOfferUseCase,
    private readonly declineUseCase: DeclineOfferUseCase,
    private readonly cancelUseCase: CancelOfferUseCase,
    private readonly expireUseCase: ExpireOfferUseCase,
    private readonly softDeleteUseCase: SoftDeleteOfferUseCase,
    private readonly bulkSendUseCase: BulkSendOffersUseCase,
    private readonly bulkExpireUseCase: BulkExpireOffersUseCase,
    private readonly bulkCancelUseCase: BulkCancelOffersUseCase,
  ) {}

  async create(dto: CreateOfferDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  async update(id: string, dto: UpdateOfferDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  async findById(id: string) {
    return this.findByIdUseCase.execute(id);
  }

  async findByApplicationId(applicationId: string) {
    return this.findByApplicationIdUseCase.execute(applicationId);
  }

  async list(query: ListOffersQueryDto) {
    return this.listUseCase.execute(query);
  }

  async send(id: string, actorUserId?: string) {
    return this.sendUseCase.execute(id, actorUserId);
  }

  async accept(id: string, actorUserId?: string) {
    return this.acceptUseCase.execute(id, actorUserId);
  }

  async decline(id: string, dto: DeclineOfferDto, actorUserId?: string) {
    return this.declineUseCase.execute(id, dto, actorUserId);
  }

  async cancel(id: string, actorUserId?: string) {
    return this.cancelUseCase.execute(id, actorUserId);
  }

  async expire(id: string, actorUserId?: string) {
    return this.expireUseCase.execute(id, actorUserId);
  }

  async softDelete(id: string, actorUserId?: string) {
    return this.softDeleteUseCase.execute(id, actorUserId);
  }

  async bulkSend(offerIds: string[], actorUserId?: string) {
    return this.bulkSendUseCase.execute({ offer_ids: offerIds }, actorUserId);
  }

  async bulkExpire(offerIds: string[], actorUserId?: string) {
    return this.bulkExpireUseCase.execute({ offer_ids: offerIds }, actorUserId);
  }

  async bulkCancel(
    offerIds: string[],
    cancelReason: string,
    actorUserId?: string,
  ) {
    return this.bulkCancelUseCase.execute(
      {
        offer_ids: offerIds,
        cancel_reason: cancelReason,
      },
      actorUserId,
    );
  }
}
