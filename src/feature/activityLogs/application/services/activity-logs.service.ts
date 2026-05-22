import { Injectable } from '@nestjs/common';

import { ListActivityLogsQueryDto } from '../../dto/list-activity-logs.query.dto';
import { FindActivityLogByIdUseCase } from '../use-cases/find-activity-log-by-id.usecase';
import { ListActivityLogsUseCase } from '../use-cases/list-activity-logs.usecase';

@Injectable()
export class ActivityLogsService {
  constructor(
    private readonly findByIdUseCase: FindActivityLogByIdUseCase,
    private readonly listUseCase: ListActivityLogsUseCase,
  ) {}

  async findById(id: string) {
    return this.findByIdUseCase.execute(id);
  }

  async list(query: ListActivityLogsQueryDto) {
    return this.listUseCase.execute(query);
  }
}
