import { Injectable } from '@nestjs/common';

import { ListSkillsQueryDto } from '../../dto/list-skills.query.dto';
import { SkillsPaginationHelper } from '../../helpers/skills-pagination.helper';
import { SkillRepository } from '../../repositories/skill.repository';

@Injectable()
export class ListSkillsUseCase {
  constructor(
    private readonly paginationHelper: SkillsPaginationHelper,
    private readonly skillRepository: SkillRepository,
  ) {}

  async execute(query: ListSkillsQueryDto) {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });
    return this.skillRepository.list(query);
  }
}
