import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateOfferDto } from '../../dto/create-offer.dto';
import { OfferEntity } from '../../entities/offer.entity';
import { OfferStatus } from '../../enums/offer-status.enum';
import { OffersValidationHelper } from '../../helpers/offers-validation.helper';
import { OfferRepository } from '../../repositories/offer.repository';

@Injectable()
export class CreateOfferUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly validationHelper: OffersValidationHelper,
  ) {}

  async execute(dto: CreateOfferDto, actorUserId?: string): Promise<OfferEntity> {
    this.validationHelper.ensureActorUserRequired(actorUserId);

    const expected = new Date(dto.expected_joining_date);
    this.validationHelper.ensureExpectedJoiningDateFuture(expected);

    if (!(Number(dto.offered_ctc) > 0)) {
      throw new BadRequestException({
        message: 'offered_ctc must be greater than 0',
        code: 'INVALID_OFFERED_CTC',
      });
    }

    if (dto.joining_bonus !== undefined && dto.joining_bonus !== null) {
      if (Number(dto.joining_bonus) < 0) {
        throw new BadRequestException({
          message: 'joining_bonus cannot be negative',
          code: 'INVALID_JOINING_BONUS',
        });
      }
    }

    if (dto.probation_period_months !== undefined && dto.probation_period_months !== null) {
      if (Number(dto.probation_period_months) < 0) {
        throw new BadRequestException({
          message: 'probation_period_months cannot be negative',
          code: 'INVALID_PROBATION_PERIOD',
        });
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const application = await this.validationHelper.ensureApplicationEligibleForOffer({
        applicationId: dto.application_id,
        manager,
      });

      await this.validationHelper.ensureNoDuplicateActiveOffer({
        applicationId: application.id,
        manager,
      });

      const created = await this.offerRepository.createAndSave(
        {
          application_id: application.id,
          offered_role_title: dto.offered_role_title,
          offered_ctc: this.validationHelper.toMoneyFixed2(dto.offered_ctc),
          joining_bonus:
            dto.joining_bonus === undefined || dto.joining_bonus === null
              ? null
              : this.validationHelper.toMoneyFixed2(dto.joining_bonus),
          currency_code: dto.currency_code ?? null,
          probation_period_months: dto.probation_period_months ?? null,
          expected_joining_date: expected,
          offer_status: OfferStatus.DRAFT,
          offered_at: null,
          accepted_at: null,
          declined_at: null,
          decline_reason: null,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: actorUserId ?? null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const loaded = await manager
        .getRepository(OfferEntity)
        .createQueryBuilder('offers')
        .where('offers.id = :id', { id: created.id })
        .andWhere('offers.deleted_at IS NULL')
        .getOne();

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'OFFER_POST_CREATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
