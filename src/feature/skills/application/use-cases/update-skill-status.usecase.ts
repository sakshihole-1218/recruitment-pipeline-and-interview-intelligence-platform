import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateSkillStatusDto } from '../../dto/update-skill-status.dto';
import { SkillEntity } from '../../entities/skill.entity';
import { SkillRepository } from '../../repositories/skill.repository';

@Injectable()
export class UpdateSkillStatusUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly skillRepository: SkillRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateSkillStatusDto,
    actorUserId?: string,
  ): Promise<SkillEntity> {
    return this.dataSource.transaction(async (manager) => {
      const skill = await this.skillRepository.findById(id, { manager });
      if (!skill) {
        throw new NotFoundException({
          message: 'Skill not found',
          code: 'SKILL_NOT_FOUND',
        });
      }

      skill.is_active = dto.is_active;
      if (actorUserId) {
        skill.updated_by_user_id = actorUserId;
      }

      await this.skillRepository.save(skill, { manager });

      const updated = await this.skillRepository.findById(skill.id, { manager });
      if (!updated) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'SKILL_POST_UPDATE_LOAD_FAILED',
        });
      }

      return updated;
    });
  }
}
