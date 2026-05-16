import { Injectable } from '@nestjs/common';

import { ListInterviewsQueryDto } from '../../dto/list-interviews.query.dto';
import { InterviewsPaginationHelper } from '../../helpers/interviews-pagination.helper';
import { InterviewRepository } from '../../repositories/interview.repository';

@Injectable()
export class ListInterviewsUseCase {
  constructor(
    private readonly paginationHelper: InterviewsPaginationHelper,
    private readonly interviewRepository: InterviewRepository,
  ) {}

  async execute(query: ListInterviewsQueryDto) {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });

    return this.interviewRepository.list(query);
  }
}
