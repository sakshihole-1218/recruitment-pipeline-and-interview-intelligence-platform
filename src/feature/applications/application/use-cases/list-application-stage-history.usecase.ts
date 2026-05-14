import { Injectable, NotFoundException } from '@nestjs/common';

import { ApplicationRepository } from '../../repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../repositories/application-stage-history.repository';

@Injectable()
export class ListApplicationStageHistoryUseCase {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
  ) {}

  async execute(applicationId: string) {
    const app = await this.applicationRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundException({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND',
      });
    }

    return this.stageHistoryRepository.listByApplicationId(applicationId);
  }
}
