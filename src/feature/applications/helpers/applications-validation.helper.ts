import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';
import { ApplicationRepository } from '../repositories/application.repository';


const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.ACTIVE,
  ApplicationStatus.ON_HOLD,
];

@Injectable()
export class ApplicationsValidationHelper {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async ensureNoDuplicateActiveApplication(options: {
    candidateId: string;
    jobOpeningId: string;
    manager?: EntityManager;
  }): Promise<void> {
    const existing = await this.applicationRepository.findActiveByCandidateAndJobOpening({
      candidateId: options.candidateId,
      jobOpeningId: options.jobOpeningId,
      activeStatuses: ACTIVE_APPLICATION_STATUSES,
      manager: options.manager,
    });

    if (existing) {
      throw new ConflictException({
        message: 'Candidate already has an active application for this job opening',
        code: 'DUPLICATE_ACTIVE_APPLICATION',
      });
    }
  }

  ensureNotTerminalStage(stage: ApplicationCurrentStage): void {
    if (
      stage === ApplicationCurrentStage.REJECTED ||
      stage === ApplicationCurrentStage.WITHDRAWN ||
      stage === ApplicationCurrentStage.HIRED
    ) {
      throw new BadRequestException({
        message: 'Application is already in a terminal stage and cannot be moved',
        code: 'APPLICATION_STAGE_TERMINAL',
      });
    }
  }

  ensureStageTransitionAllowed(options: {
    from: ApplicationCurrentStage;
    to: ApplicationCurrentStage;
    resume_from_stage?: ApplicationCurrentStage | null;
  }): void {
    const from = options.from;
    const to = options.to;

    if (from === to) {
      throw new BadRequestException({
        message: 'from_stage and to_stage cannot be the same',
        code: 'INVALID_STAGE_TRANSITION',
      });
    }

    if (to === ApplicationCurrentStage.ON_HOLD) {
      const allowedFrom = new Set<ApplicationCurrentStage>([
        ApplicationCurrentStage.APPLIED,
        ApplicationCurrentStage.SCREENING,
        ApplicationCurrentStage.SHORTLISTED,
        ApplicationCurrentStage.INTERVIEW,
        ApplicationCurrentStage.DECISION,
        ApplicationCurrentStage.OFFER,
      ]);

      if (!allowedFrom.has(from)) {
        throw new ConflictException({
          message: 'Application cannot be put on hold from the current stage',
          code: 'INVALID_HOLD_TRANSITION',
        });
      }

      return;
    }

    if (to === ApplicationCurrentStage.WITHDRAWN) {
      if (from === ApplicationCurrentStage.REJECTED || from === ApplicationCurrentStage.HIRED) {
        throw new ConflictException({
          message: 'Application cannot be withdrawn from the current stage',
          code: 'INVALID_WITHDRAW_TRANSITION',
        });
      }

      return;
    }

    if (from === ApplicationCurrentStage.ON_HOLD) {
      const resumeTo = options.resume_from_stage;
      if (!resumeTo) {
        throw new ConflictException({
          message: 'Application cannot be resumed because previous stage is unknown',
          code: 'APPLICATION_RESUME_STAGE_UNKNOWN',
        });
      }

      if (to !== resumeTo) {
        throw new ConflictException({
          message: 'Application on hold can only be resumed to the previous stage',
          code: 'INVALID_RESUME_TRANSITION',
        });
      }

      return;
    }

    const forwardMap: Record<ApplicationCurrentStage, ApplicationCurrentStage[]> = {
      [ApplicationCurrentStage.APPLIED]: [ApplicationCurrentStage.SCREENING],
      [ApplicationCurrentStage.SCREENING]: [
        ApplicationCurrentStage.SHORTLISTED,
        ApplicationCurrentStage.REJECTED,
      ],
      [ApplicationCurrentStage.SHORTLISTED]: [
        ApplicationCurrentStage.INTERVIEW,
        ApplicationCurrentStage.REJECTED,
      ],
      [ApplicationCurrentStage.INTERVIEW]: [
        ApplicationCurrentStage.DECISION,
        ApplicationCurrentStage.REJECTED,
      ],
      [ApplicationCurrentStage.DECISION]: [
        ApplicationCurrentStage.OFFER,
        ApplicationCurrentStage.REJECTED,
      ],
      [ApplicationCurrentStage.OFFER]: [
        ApplicationCurrentStage.HIRED,
        ApplicationCurrentStage.REJECTED,
      ],
      [ApplicationCurrentStage.HIRED]: [],
      [ApplicationCurrentStage.REJECTED]: [],
      [ApplicationCurrentStage.WITHDRAWN]: [],
      [ApplicationCurrentStage.ON_HOLD]: [],
    };

    const allowed = new Set<ApplicationCurrentStage>(forwardMap[from] ?? []);
    if (!allowed.has(to)) {
      throw new ConflictException({
        message: 'Invalid application stage transition',
        code: 'INVALID_STAGE_TRANSITION',
      });
    }
  }
}
