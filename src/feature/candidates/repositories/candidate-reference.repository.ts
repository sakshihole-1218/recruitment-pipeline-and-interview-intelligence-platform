import { Injectable } from '@nestjs/common';
import { EntityManager, In, IsNull, Repository } from 'typeorm';

import { SkillEntity } from '../../skills/entities/skill.entity';

@Injectable()
export class CandidateReferenceRepository {
  private skillRepo(manager: EntityManager): Repository<SkillEntity> {
    return manager.getRepository(SkillEntity);
  }

  async findSkillsByIds(
    skillIds: string[],
    manager: EntityManager,
  ): Promise<SkillEntity[]> {
    if (!skillIds.length) return [];

    return this.skillRepo(manager).find({
      where: {
        id: In(skillIds),
        deleted_at: IsNull(),
      },
    });
  }
}
