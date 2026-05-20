import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateSkillDto } from '../../dto/update-skill.dto';
import { SkillEntity } from '../../entities/skill.entity';
import { SkillRepository } from '../../repositories/skill.repository';
import { SkillsValidationHelper } from '../../helpers/skills-validation.helper';

@Injectable()
export class UpdateSkillUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly skillRepository: SkillRepository,
    private readonly validationHelper: SkillsValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: UpdateSkillDto,
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

      if (dto.code !== undefined) {
        const code = this.validationHelper.normalizeCode(dto.code);
        await this.validationHelper.ensureUniqueCode({
          code,
          excludeId: skill.id,
          manager,
        });
        skill.code = code;
      }

      if (dto.name !== undefined) {
        const name = this.validationHelper.normalizeName(dto.name);
        await this.validationHelper.ensureUniqueName({
          name,
          excludeId: skill.id,
          manager,
        });
        skill.name = name;
      }

      if (dto.description !== undefined) {
        skill.description = dto.description ?? null;
      }

      if (dto.category !== undefined) {
        skill.category = dto.category;
      }

      if (dto.is_active !== undefined) {
        skill.is_active = dto.is_active;
      }

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
