import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateSkillDto } from '../../dto/create-skill.dto';
import { SkillEntity } from '../../entities/skill.entity';
import { SkillRepository } from '../../repositories/skill.repository';
import { SkillsValidationHelper } from '../../helpers/skills-validation.helper';

@Injectable()
export class CreateSkillUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly skillRepository: SkillRepository,
    private readonly validationHelper: SkillsValidationHelper,
  ) {}

  async execute(dto: CreateSkillDto, actorUserId?: string): Promise<SkillEntity> {
    return this.dataSource.transaction(async (manager) => {
      const code = this.validationHelper.normalizeCode(dto.code);
      const name = this.validationHelper.normalizeName(dto.name);

      const existingByCode = await this.skillRepository.findByCode(code, {
        includeDeleted: true,
        manager,
      });

      // Code is treated as globally unique (even for soft-deleted rows).
      // If the record exists but is soft-deleted, we restore it instead of creating a duplicate.
      if (existingByCode) {
        if (!existingByCode.deleted_at) {
          throw new ConflictException({
            message: 'A skill with this code already exists',
            code: 'SKILL_CODE_ALREADY_EXISTS',
          });
        }

        await this.validationHelper.ensureUniqueName({
          name,
          excludeId: existingByCode.id,
          manager,
        });

        existingByCode.name = name;
        existingByCode.description = dto.description ?? null;
        existingByCode.category = dto.category;
        existingByCode.is_active = dto.is_active ?? true;
        existingByCode.deleted_at = null;
        existingByCode.deleted_by_user_id = null;
        existingByCode.updated_by_user_id = actorUserId ?? existingByCode.updated_by_user_id;

        await this.skillRepository.save(existingByCode, { manager });

        const restored = await this.skillRepository.findById(existingByCode.id, {
          manager,
        });
        if (!restored) {
          throw new ConflictException({
            message: 'We could not complete the request. Please try again',
            code: 'SKILL_POST_CREATE_LOAD_FAILED',
          });
        }

        return restored;
      }

      await this.validationHelper.ensureUniqueName({ name, manager });

      const created = await this.skillRepository.createAndSave(
        {
          name,
          code,
          description: dto.description ?? null,
          category: dto.category,
          is_active: dto.is_active ?? true,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const loaded = await this.skillRepository.findById(created.id, { manager });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'SKILL_POST_CREATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
