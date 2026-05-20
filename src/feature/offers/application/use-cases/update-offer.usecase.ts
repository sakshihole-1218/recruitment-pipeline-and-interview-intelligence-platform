import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateOfferDto } from '../../dto/update-offer.dto';
import { OfferEntity } from '../../entities/offer.entity';
import { OffersValidationHelper } from '../../helpers/offers-validation.helper';
import { OfferRepository } from '../../repositories/offer.repository';

@Injectable()
export class UpdateOfferUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly validationHelper: OffersValidationHelper,
  ) {}

  async execute(id: string, dto: UpdateOfferDto, actorUserId?: string): Promise<OfferEntity> {
    this.validationHelper.ensureActorUserRequired(actorUserId);

    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException({
        message: 'No fields provided for update',
        code: 'EMPTY_UPDATE_PAYLOAD',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const offer = await this.offerRepository.findById(id, { manager });
      if (!offer) {
        throw new NotFoundException({
          message: 'Offer not found',
          code: 'OFFER_NOT_FOUND',
        });
      }

      this.validationHelper.ensureEditable(offer);

      if (dto.expected_joining_date) {
        const expected = new Date(dto.expected_joining_date);
        this.validationHelper.ensureExpectedJoiningDateFuture(expected);
        offer.expected_joining_date = expected;
      }

      if (dto.offered_role_title !== undefined) {
        offer.offered_role_title = dto.offered_role_title;
      }

      if (dto.offered_ctc !== undefined) {
        if (!(Number(dto.offered_ctc) > 0)) {
          throw new BadRequestException({
            message: 'offered_ctc must be greater than 0',
            code: 'INVALID_OFFERED_CTC',
          });
        }
        offer.offered_ctc = this.validationHelper.toMoneyFixed2(dto.offered_ctc);
      }

      if (dto.joining_bonus !== undefined) {
        if (dto.joining_bonus === null) {
          offer.joining_bonus = null;
        } else {
          if (Number(dto.joining_bonus) < 0) {
            throw new BadRequestException({
              message: 'joining_bonus cannot be negative',
              code: 'INVALID_JOINING_BONUS',
            });
          }
          offer.joining_bonus = this.validationHelper.toMoneyFixed2(dto.joining_bonus);
        }
      }

      if (dto.currency_code !== undefined) {
        offer.currency_code = dto.currency_code ?? null;
      }

      if (dto.probation_period_months !== undefined) {
        const months = dto.probation_period_months ?? null;
        if (months !== null && Number(months) < 0) {
          throw new BadRequestException({
            message: 'probation_period_months cannot be negative',
            code: 'INVALID_PROBATION_PERIOD',
          });
        }
        offer.probation_period_months = months;
      }

      offer.updated_by_user_id = actorUserId ?? null;

      await this.offerRepository.save(offer, { manager });

      const loaded = await this.offerRepository.findById(offer.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'OFFER_POST_UPDATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
