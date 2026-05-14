import { Injectable } from '@nestjs/common';

import { ListApplicationsQueryDto } from '../../dto/list-applications.query.dto';
import { ApplicationsPaginationHelper } from '../../helpers/applications-pagination.helper';
import { ApplicationRepository } from '../../repositories/application.repository';

@Injectable()
export class ListApplicationsUseCase {
  constructor(
    private readonly paginationHelper: ApplicationsPaginationHelper,
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(query: ListApplicationsQueryDto) {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });

    return this.applicationRepository.list(query);
  }
}
