import { Injectable, NotFoundException } from '@nestjs/common';

import { SkillEntity } from '../../entities/skill.entity';
import { SkillRepository } from '../../repositories/skill.repository';

@Injectable()
export class FindSkillByIdUseCase {
  constructor(private readonly skillRepository: SkillRepository) {}

  async execute(id: string): Promise<SkillEntity> {
    const skill = await this.skillRepository.findById(id);
    if (!skill) {
      throw new NotFoundException({
        message: 'Skill not found',
        code: 'SKILL_NOT_FOUND',
      });
    }
    return skill;
  }
}
