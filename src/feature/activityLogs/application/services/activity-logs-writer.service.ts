import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ActivityLogEntity } from '../../entities/activity-log.entity';
import { CreateActivityLogUseCase } from '../use-cases/create-activity-log.usecase';

@Injectable()
export class ActivityLogsWriterService {
  constructor(private readonly createUseCase: CreateActivityLogUseCase) {}

  async log(payload: Partial<ActivityLogEntity>, options?: { manager?: EntityManager }) {
    return this.createUseCase.execute(payload, { manager: options?.manager });
  }
}
