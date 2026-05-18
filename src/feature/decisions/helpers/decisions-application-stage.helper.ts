import { ApplicationCurrentStage } from '../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../applications/enums/application-status.enum';
import { DecisionStatus } from '../enums/decision-status.enum';

export class DecisionsApplicationStageHelper {
  static mapDecisionToApplicationState(options: {
    decision_status: DecisionStatus;
    decision_reason: string | null;
  }): {
    current_stage: ApplicationCurrentStage;
    application_status: ApplicationStatus;
    rejection_reason: string | null;
  } {
    switch (options.decision_status) {
      case DecisionStatus.REJECTED:
        return {
          current_stage: ApplicationCurrentStage.REJECTED,
          application_status: ApplicationStatus.REJECTED,
          rejection_reason: options.decision_reason,
        };

      case DecisionStatus.HOLD:
        return {
          current_stage: ApplicationCurrentStage.ON_HOLD,
          application_status: ApplicationStatus.ON_HOLD,
          rejection_reason: null,
        };

      case DecisionStatus.HIRED:
        return {
          current_stage: ApplicationCurrentStage.HIRED,
          application_status: ApplicationStatus.HIRED,
          rejection_reason: null,
        };

      case DecisionStatus.SELECTED:
      case DecisionStatus.OFFER_IN_PROGRESS:
      case DecisionStatus.OFFERED:
      default:
        return {
          current_stage: ApplicationCurrentStage.OFFER,
          application_status: ApplicationStatus.ACTIVE,
          rejection_reason: null,
        };
    }
  }
}
