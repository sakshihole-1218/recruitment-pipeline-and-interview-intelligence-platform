import { Injectable, NotFoundException } from '@nestjs/common';

import { ApplicationDecisionEntity } from '../../entities/application-decision.entity';
import { ApplicationDecisionRepository } from '../../repositories/application-decision.repository';

@Injectable()
export class FindDecisionByApplicationIdUseCase {
  constructor(
    private readonly decisionRepository: ApplicationDecisionRepository,
  ) {}

  async execute(applicationId: string): Promise<ApplicationDecisionEntity> {
    const decision = await this.decisionRepository.findByApplicationId(
      applicationId,
    );

    if (!decision) {
      throw new NotFoundException({
        message: 'Decision not found for application',
        code: 'DECISION_NOT_FOUND_FOR_APPLICATION',
      });
    }

    return decision;
  }
}
