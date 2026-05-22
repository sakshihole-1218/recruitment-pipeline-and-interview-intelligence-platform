import { Injectable, NotFoundException } from '@nestjs/common';

import { ActivityLogRepository } from '../../repositories/activity-log.repository';

@Injectable()
export class FindActivityLogByIdUseCase {
  constructor(private readonly activityLogRepository: ActivityLogRepository) {}

  async execute(id: string) {
    const row = await this.activityLogRepository.findById(id);
    if (!row) {
      throw new NotFoundException({
        message: 'Activity log not found',
        code: 'ACTIVITY_LOG_NOT_FOUND',
      });
    }
    return row;
  }
}
