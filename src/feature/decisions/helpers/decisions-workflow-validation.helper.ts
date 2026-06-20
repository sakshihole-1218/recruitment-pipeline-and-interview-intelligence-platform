import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ApplicationCurrentStage } from '../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../applications/enums/application-status.enum';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { OfferStatus } from '../../offers/enums/offer-status.enum';
import { OfferRepository } from '../../offers/repositories/offer.repository';
import { DecisionStatus } from '../enums/decision-status.enum';

@Injectable()
export class DecisionsWorkflowValidationHelper {
  ensureDecisionTransitionAllowed(options: {
    from: DecisionStatus;
    to: DecisionStatus;
  }): void {
    if (options.from === options.to) return;

    const allowed = DECISION_TRANSITIONS.get(options.from);
    if (!allowed || !allowed.has(options.to)) {
      throw new ConflictException({
        message: 'Decision status transition is not allowed',
        code: 'DECISION_STATUS_TRANSITION_NOT_ALLOWED',
        meta: { from: options.from, to: options.to },
      });
    }
  }

  ensureApplicationStateAllowsDecisionUpdate(app: ApplicationEntity): void {
    if (app.application_status === ApplicationStatus.CLOSED) {
      throw new ConflictException({
        message: 'Decision cannot be updated for CLOSED applications',
        code: 'DECISION_UPDATE_NOT_ALLOWED_CLOSED',
      });
    }

    if (app.current_stage === ApplicationCurrentStage.WITHDRAWN) {
      throw new ConflictException({
        message: 'Decision cannot be updated for WITHDRAWN applications',
        code: 'DECISION_UPDATE_NOT_ALLOWED_WITHDRAWN',
      });
    }
  }

  async ensureOfferStateAllowsDecisionUpdate(options: {
    applicationId: string;
    nextDecisionStatus: DecisionStatus;
    manager: EntityManager;
    offerRepository: OfferRepository;
  }): Promise<void> {
    const latest = await options.offerRepository.findLatestByApplicationId(
      options.applicationId,
      { manager: options.manager },
    );

    if (!latest) return;

    if (latest.offer_status === OfferStatus.ACCEPTED) {
      throw new ConflictException({
        message: 'Decision cannot be updated after offer is accepted',
        code: 'DECISION_UPDATE_NOT_ALLOWED_OFFER_ACCEPTED',
      });
    }

    const isActiveOffer = [OfferStatus.DRAFT, OfferStatus.SENT].includes(
      latest.offer_status,
    );

    const isOfferFamilyDecision = OFFER_FAMILY_DECISIONS.has(
      options.nextDecisionStatus,
    );

    if (isActiveOffer && !isOfferFamilyDecision) {
      throw new ConflictException({
        message:
          'Decision cannot be updated while an active offer exists for the application',
        code: 'DECISION_UPDATE_BLOCKED_BY_ACTIVE_OFFER',
        meta: { offer_status: latest.offer_status },
      });
    }

    if (
      isActiveOffer &&
      [DecisionStatus.REJECTED, DecisionStatus.HOLD].includes(
        options.nextDecisionStatus,
      )
    ) {
      throw new ConflictException({
        message:
          'Decision cannot be moved to HOLD/REJECTED while an active offer exists',
        code: 'DECISION_UPDATE_NOT_ALLOWED_WITH_ACTIVE_OFFER',
        meta: { offer_status: latest.offer_status },
      });
    }

    if (options.nextDecisionStatus === DecisionStatus.HIRED) {
      throw new ConflictException({
        message: 'Decision cannot be marked HIRED without an accepted offer',
        code: 'DECISION_HIRED_REQUIRES_ACCEPTED_OFFER',
      });
    }
  }

  async ensureHiredDecisionConsistency(options: {
    applicationId: string;
    manager: EntityManager;
    offerRepository: OfferRepository;
  }): Promise<void> {
    const latest = await options.offerRepository.findLatestByApplicationId(
      options.applicationId,
      { manager: options.manager },
    );

    if (!latest || latest.offer_status !== OfferStatus.ACCEPTED) {
      throw new ConflictException({
        message: 'HIRED decision requires an accepted offer',
        code: 'DECISION_HIRED_REQUIRES_ACCEPTED_OFFER',
      });
    }
  }
}

const OFFER_FAMILY_DECISIONS = new Set<DecisionStatus>([
  DecisionStatus.SELECTED,
  DecisionStatus.OFFER_IN_PROGRESS,
  DecisionStatus.OFFERED,
  DecisionStatus.HIRED,
]);

const DECISION_TRANSITIONS: Map<DecisionStatus, Set<DecisionStatus>> = new Map([
  [
    DecisionStatus.HOLD,
    new Set([
      DecisionStatus.HOLD,
      DecisionStatus.SELECTED,
      DecisionStatus.REJECTED,
    ]),
  ],

  [
    DecisionStatus.SELECTED,
    new Set([
      DecisionStatus.SELECTED,
      DecisionStatus.HOLD,
      DecisionStatus.REJECTED,
      DecisionStatus.OFFER_IN_PROGRESS,
      DecisionStatus.OFFERED,
      DecisionStatus.HIRED,
    ]),
  ],
  [
    DecisionStatus.OFFER_IN_PROGRESS,
    new Set([
      DecisionStatus.OFFER_IN_PROGRESS,
      DecisionStatus.OFFERED,
      DecisionStatus.HIRED,
    ]),
  ],
  [
    DecisionStatus.OFFERED,
    new Set([DecisionStatus.OFFERED, DecisionStatus.HIRED]),
  ],

  [DecisionStatus.REJECTED, new Set([DecisionStatus.REJECTED])],
  [DecisionStatus.HIRED, new Set([DecisionStatus.HIRED])],
]);
