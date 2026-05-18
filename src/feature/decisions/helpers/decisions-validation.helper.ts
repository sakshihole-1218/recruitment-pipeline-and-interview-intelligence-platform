import { BadRequestException, Injectable } from '@nestjs/common';

import { DecisionStatus } from '../enums/decision-status.enum';

@Injectable()
export class DecisionsValidationHelper {
  normalizeReason(value?: string): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
  }

  ensureReasonRules(options: {
    decision_status: DecisionStatus;
    decision_reason: string | null;
  }): void {
    if (
      [DecisionStatus.REJECTED, DecisionStatus.HOLD].includes(
        options.decision_status,
      )
    ) {
      if (!options.decision_reason) {
        throw new BadRequestException({
          message:
            'Decision reason is required for REJECTED and HOLD decisions',
          code: 'DECISION_REASON_REQUIRED',
        });
      }
    }
  }
}
