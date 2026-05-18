import { Injectable } from '@nestjs/common';

import { ListDecisionsQueryDto } from '../../dto/list-decisions.query.dto';
import { DecisionsPaginationHelper } from '../../helpers/decisions-pagination.helper';
import { ApplicationDecisionRepository } from '../../repositories/application-decision.repository';

@Injectable()
export class ListDecisionsUseCase {
  constructor(
    private readonly paginationHelper: DecisionsPaginationHelper,
    private readonly decisionRepository: ApplicationDecisionRepository,
  ) {}

  async execute(query: ListDecisionsQueryDto) {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });

    return this.decisionRepository.list(query);
  }
}
