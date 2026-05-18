import { Injectable, NotFoundException } from '@nestjs/common';

import { ApplicationDecisionEntity } from '../../entities/application-decision.entity';
import { ApplicationDecisionRepository } from '../../repositories/application-decision.repository';

@Injectable()
export class FindDecisionByIdUseCase {
  constructor(
    private readonly decisionRepository: ApplicationDecisionRepository,
  ) {}

  async execute(id: string): Promise<ApplicationDecisionEntity> {
    const decision = await this.decisionRepository.findById(id);

    if (!decision) {
      throw new NotFoundException({
        message: 'Decision not found',
        code: 'DECISION_NOT_FOUND',
      });
    }

    return decision;
  }
}
