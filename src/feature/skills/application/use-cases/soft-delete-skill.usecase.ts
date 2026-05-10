import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { SkillRepository } from '../../repositories/skill.repository';

@Injectable()
export class SoftDeleteSkillUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly skillRepository: SkillRepository,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const skill = await this.skillRepository.findById(id, { manager });

      if (!skill) {
        throw new NotFoundException({
          message: 'Skill not found',
          code: 'SKILL_NOT_FOUND',
        });
      }

      skill.deleted_at = new Date();
      skill.deleted_by_user_id = actorUserId ?? null;
      skill.updated_by_user_id = actorUserId ?? skill.updated_by_user_id;

      await this.skillRepository.save(skill, { manager });

      const loaded = await this.skillRepository.findById(id, { manager });
      if (loaded) {
        throw new ConflictException({
          message: 'We could not delete the skill. Please try again',
          code: 'SKILL_SOFT_DELETE_FAILED',
        });
      }
    });
  }
}
