import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';

import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';

@Injectable()
export class ApplicationScreeningValidationHelper {
  ensureCanStartScreening(currentStage: ApplicationCurrentStage): void {
    if (currentStage !== ApplicationCurrentStage.APPLIED) {
      throw new ConflictException({
        message: 'Screening can only be started when application is in APPLIED stage',
        code: 'APPLICATION_SCREENING_START_INVALID_STAGE',
        meta: { current_stage: currentStage },
      });
    }
  }

  ensureCanCompleteScreening(currentStage: ApplicationCurrentStage): void {
    if (currentStage !== ApplicationCurrentStage.SCREENING) {
      throw new ConflictException({
        message: 'Screening can only be completed when application is in SCREENING stage',
        code: 'APPLICATION_SCREENING_COMPLETE_INVALID_STAGE',
        meta: { current_stage: currentStage },
      });
    }
  }

  ensureScoreInRange(options: { field: string; value: number; min: number; max: number }): void {
    const value = Number(options.value);

    if (!Number.isFinite(value)) {
      throw new BadRequestException({
        message: `${options.field} must be a valid number`,
        code: 'INVALID_SCREENING_SCORE',
        meta: { field: options.field },
      });
    }

    if (value < options.min || value > options.max) {
      throw new BadRequestException({
        message: `${options.field} must be between ${options.min} and ${options.max}`,
        code: 'INVALID_SCREENING_SCORE_RANGE',
        meta: { field: options.field, min: options.min, max: options.max },
      });
    }
  }
}
