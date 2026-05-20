import { Injectable } from '@nestjs/common';

import { ListJobOpeningsQueryDto } from '../../dto/list-job-openings.query.dto';
import { JobOpeningsPaginationHelper } from '../../helpers/job-openings-pagination.helper';
import { JobOpeningRepository } from '../../repositories/job-opening.repository';

@Injectable()
export class ListJobOpeningsUseCase {
  constructor(
    private readonly paginationHelper: JobOpeningsPaginationHelper,
    private readonly jobOpeningRepository: JobOpeningRepository,
  ) {}

  async execute(query: ListJobOpeningsQueryDto) {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });
    return this.jobOpeningRepository.list(query);
  }
}
