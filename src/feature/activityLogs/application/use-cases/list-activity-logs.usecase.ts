import { Injectable } from '@nestjs/common';

import { ListActivityLogsQueryDto } from '../../dto/list-activity-logs.query.dto';
import { ActivityLogsPaginationHelper } from '../../helpers/activity-logs-pagination.helper';
import { ActivityLogRepository } from '../../repositories/activity-log.repository';

@Injectable()
export class ListActivityLogsUseCase {
  constructor(
    private readonly paginationHelper: ActivityLogsPaginationHelper,
    private readonly activityLogRepository: ActivityLogRepository,
  ) {}

  async execute(query: ListActivityLogsQueryDto) {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });
    return this.activityLogRepository.list(query);
  }
}
