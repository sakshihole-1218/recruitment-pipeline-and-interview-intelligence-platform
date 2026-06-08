import { BadRequestException, Injectable } from '@nestjs/common';

import { DecisionSource } from '../enums/decision-source.enum';
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

  normalizeNotes(value?: string): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
  }

  resolveDecisionSource(options: {
    requestedSource?: DecisionSource | null;
    hasHumanInterviewFeedback: boolean;
    hasAiInterviewFeedback: boolean;
  }): DecisionSource {
    if (options.requestedSource) {
      return options.requestedSource;
    }

    if (options.hasHumanInterviewFeedback && options.hasAiInterviewFeedback) {
      return DecisionSource.HYBRID;
    }

    if (options.hasAiInterviewFeedback) {
      return DecisionSource.AI_INTERVIEW;
    }

    if (options.hasHumanInterviewFeedback) {
      return DecisionSource.HUMAN_INTERVIEW;
    }

    return DecisionSource.MANUAL;
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

  ensureDecisionSourceRules(options: {
    decisionSource: DecisionSource;
    hasHumanInterviewFeedback: boolean;
    hasAiInterviewFeedback: boolean;
    hasSubmittedAiReview: boolean;
  }): void {
    switch (options.decisionSource) {
      case DecisionSource.HUMAN_INTERVIEW:
        if (!options.hasHumanInterviewFeedback) {
          throw new BadRequestException({
            message:
              'HUMAN_INTERVIEW decisions require completed interview feedback',
            code: 'DECISION_HUMAN_FEEDBACK_REQUIRED',
          });
        }
        return;

      case DecisionSource.AI_INTERVIEW:
        if (!options.hasAiInterviewFeedback) {
          throw new BadRequestException({
            message:
              'AI_INTERVIEW decisions require completed AI interview feedback',
            code: 'DECISION_AI_FEEDBACK_REQUIRED',
          });
        }

        if (!options.hasSubmittedAiReview) {
          throw new BadRequestException({
            message:
              'AI_INTERVIEW decisions require at least one submitted interviewer review',
            code: 'DECISION_AI_REVIEW_REQUIRED',
          });
        }
        return;

      case DecisionSource.HYBRID:
        if (!options.hasHumanInterviewFeedback && !options.hasAiInterviewFeedback) {
          throw new BadRequestException({
            message:
              'HYBRID decisions require human interview feedback or completed AI interview feedback',
            code: 'DECISION_HYBRID_FEEDBACK_REQUIRED',
          });
        }

        if (!options.hasAiInterviewFeedback) {
          throw new BadRequestException({
            message:
              'HYBRID decisions require completed AI interview feedback',
            code: 'DECISION_HYBRID_AI_FEEDBACK_REQUIRED',
          });
        }

        if (!options.hasSubmittedAiReview) {
          throw new BadRequestException({
            message:
              'HYBRID decisions require at least one submitted interviewer review',
            code: 'DECISION_HYBRID_AI_REVIEW_REQUIRED',
          });
        }
        return;

      case DecisionSource.MANUAL:
      default:
        return;
    }
  }
}
