import { ConflictException, Injectable } from '@nestjs/common';

import { DecisionStatus } from '../enums/decision-status.enum';

@Injectable()
export class DecisionTransitionValidator {
  ensureAllowed(options: {
    from: DecisionStatus;
    to: DecisionStatus;
  }): void {
    if (options.from === options.to) {
      return;
    }

    const allowed = DECISION_TRANSITIONS.get(options.from);
    if (!allowed || !allowed.has(options.to)) {
      throw new ConflictException({
        message: 'Decision status transition is not allowed',
        code: 'DECISION_STATUS_TRANSITION_NOT_ALLOWED',
        meta: { from: options.from, to: options.to },
      });
    }
  }
}

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
    new Set([
      DecisionStatus.OFFERED,
      DecisionStatus.HIRED,
    ]),
  ],
  [DecisionStatus.REJECTED, new Set([DecisionStatus.REJECTED])],
  [DecisionStatus.HIRED, new Set([DecisionStatus.HIRED])],
]);