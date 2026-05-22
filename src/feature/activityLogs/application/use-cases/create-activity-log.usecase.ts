import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ActivityLogRepository } from '../../repositories/activity-log.repository';
import { ActivityLogEntity } from '../../entities/activity-log.entity';

@Injectable()
export class CreateActivityLogUseCase {
  constructor(private readonly repository: ActivityLogRepository) {}

  async execute(
    payload: Partial<ActivityLogEntity>,
    options?: { manager?: EntityManager },
  ): Promise<ActivityLogEntity> {
    return this.repository.createAndSave(payload, { manager: options?.manager });
  }
}
