import { Injectable } from '@nestjs/common';

import { ListCandidatesQueryDto } from '../../dto/list-candidates.query.dto';
import { CandidatesPaginationHelper } from '../../helpers/candidates-pagination.helper';
import { CandidateRepository } from '../../repositories/candidate.repository';

@Injectable()
export class ListCandidatesUseCase {
  constructor(
    private readonly paginationHelper: CandidatesPaginationHelper,
    private readonly candidateRepository: CandidateRepository,
  ) {}

  async execute(query: ListCandidatesQueryDto) {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });

    return this.candidateRepository.list(query);
  }
}
