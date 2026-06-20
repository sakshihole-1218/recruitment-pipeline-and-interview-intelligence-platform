import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ApplicationCurrentStage } from '../../applications/enums/application-current-stage.enum';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { ApplicationRepository } from '../../applications/repositories/application.repository';
import { OfferStatus } from '../enums/offer-status.enum';
import { OfferRepository } from '../repositories/offer.repository';
import { OfferEntity } from '../entities/offer.entity';

@Injectable()
export class OffersValidationHelper {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly offerRepository: OfferRepository,
  ) {}

  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureEditable(offer: OfferEntity): void {
    if (offer.offer_status !== OfferStatus.DRAFT) {
      throw new ConflictException({
        message: 'Only DRAFT offers can be updated',
        code: 'OFFER_NOT_EDITABLE',
      });
    }
  }

  ensureStatusIn(
    offer: OfferEntity,
    allowed: OfferStatus[],
    code: string,
  ): void {
    const set = new Set(allowed);
    if (!set.has(offer.offer_status)) {
      throw new ConflictException({
        message: 'Offer status transition is not allowed',
        code,
      });
    }
  }

  ensureExpectedJoiningDateFuture(date: Date): void {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new BadRequestException({
        message: 'Invalid expected_joining_date',
        code: 'INVALID_EXPECTED_JOINING_DATE',
      });
    }

    const now = new Date();
    if (date.getTime() <= now.getTime()) {
      throw new BadRequestException({
        message: 'expected_joining_date must be a future date',
        code: 'EXPECTED_JOINING_DATE_NOT_FUTURE',
      });
    }
  }

  toMoneyFixed2(value: number): string {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      throw new BadRequestException({
        message: 'Invalid monetary value',
        code: 'INVALID_MONEY_VALUE',
      });
    }
    return num.toFixed(2);
  }

  async ensureApplicationEligibleForOffer(options: {
    applicationId: string;
    manager?: EntityManager;
  }): Promise<ApplicationEntity> {
    const app = await this.applicationRepository.findById(
      options.applicationId,
      {
        manager: options.manager,
      },
    );

    if (!app) {
      throw new BadRequestException({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND',
      });
    }

    const eligibleStages = new Set<ApplicationCurrentStage>([
      ApplicationCurrentStage.DECISION,
      ApplicationCurrentStage.OFFER,
    ]);
    if (!eligibleStages.has(app.current_stage)) {
      throw new ConflictException({
        message:
          'Offer can only be created for applications in DECISION or OFFER stage',
        code: 'APPLICATION_NOT_ELIGIBLE_FOR_OFFER',
      });
    }

    return app;
  }

  async ensureNoDuplicateActiveOffer(options: {
    applicationId: string;
    manager?: EntityManager;
  }): Promise<void> {
    const existing = await this.offerRepository.findActiveByApplicationId(
      options.applicationId,
      { manager: options.manager },
    );

    if (existing) {
      throw new ConflictException({
        message: 'An active offer already exists for this application',
        code: 'DUPLICATE_ACTIVE_OFFER',
      });
    }
  }
}
