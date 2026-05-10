import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { SkillRepository } from '../repositories/skill.repository';

@Injectable()
export class SkillsValidationHelper {
  constructor(private readonly skillRepository: SkillRepository) {}

  normalizeCode(code: string): string {
    const normalized = String(code ?? '').trim().toUpperCase();
    if (!normalized) {
      throw new BadRequestException({
        message: 'Skill code is required',
        code: 'SKILL_CODE_REQUIRED',
      });
    }
    return normalized;
  }

  normalizeName(name: string): string {
    const normalized = normalizeSearch(name);
    if (!normalized) {
      throw new BadRequestException({
        message: 'Skill name is required',
        code: 'SKILL_NAME_REQUIRED',
      });
    }
    return normalized;
  }

  async ensureUniqueCode(options: {
    code: string;
    excludeId?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const existing = await this.skillRepository.findByCode(options.code, {
      includeDeleted: true,
      manager: options.manager,
    });

    if (existing && existing.id !== options.excludeId) {
      throw new ConflictException({
        message: 'A skill with this code already exists',
        code: 'SKILL_CODE_ALREADY_EXISTS',
      });
    }
  }

  async ensureUniqueName(options: {
    name: string;
    excludeId?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const existing = await this.skillRepository.findByName(options.name, {
      includeDeleted: false,
      manager: options.manager,
    });

    if (existing && existing.id !== options.excludeId) {
      throw new ConflictException({
        message: 'A skill with this name already exists',
        code: 'SKILL_NAME_ALREADY_EXISTS',
      });
    }
  }
}
