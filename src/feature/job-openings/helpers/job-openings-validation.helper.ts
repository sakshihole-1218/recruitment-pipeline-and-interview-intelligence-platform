import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { JobOpeningSkillInputDto } from '../dto/job-opening-skill.input.dto';
import { JobOpeningRepository } from '../repositories/job-opening.repository';

@Injectable()
export class JobOpeningsValidationHelper {
  constructor(private readonly jobOpeningRepository: JobOpeningRepository) {}

  normalizeCode(code: string): string {
    const normalized = String(code ?? '')
      .trim()
      .toUpperCase();
    if (!normalized) {
      throw new BadRequestException({
        message: 'Job opening code is required',
        code: 'JOB_OPENING_CODE_REQUIRED',
      });
    }
    return normalized;
  }

  normalizeTitle(title: string): string {
    const normalized = normalizeSearch(title);
    if (!normalized) {
      throw new BadRequestException({
        message: 'Job opening title is required',
        code: 'JOB_OPENING_TITLE_REQUIRED',
      });
    }
    return normalized;
  }

  validateExperienceRange(options: {
    min?: number | null;
    max?: number | null;
  }): void {
    const min = options.min;
    const max = options.max;
    if (min === undefined || max === undefined) {
      return;
    }

    if (min !== null && max !== null && min > max) {
      throw new BadRequestException({
        message: 'Minimum experience cannot be greater than maximum experience',
        code: 'INVALID_EXPERIENCE_RANGE',
      });
    }
  }

  validateSalaryRange(options: {
    min?: number | null;
    max?: number | null;
  }): void {
    const min = options.min;
    const max = options.max;
    if (min === undefined || max === undefined) {
      return;
    }

    if (min !== null && max !== null && min > max) {
      throw new BadRequestException({
        message: 'Minimum salary cannot be greater than maximum salary',
        code: 'INVALID_SALARY_RANGE',
      });
    }
  }

  validateOpeningsCount(openingsCount: number): void {
    if (!Number.isFinite(openingsCount) || openingsCount <= 0) {
      throw new BadRequestException({
        message: 'Openings count must be greater than zero',
        code: 'INVALID_OPENINGS_COUNT',
      });
    }
  }

  dedupeAndValidateSkills(
    input?: JobOpeningSkillInputDto[],
  ): JobOpeningSkillInputDto[] {
    if (!input) {
      return [];
    }

    const seen = new Set<string>();
    const output: JobOpeningSkillInputDto[] = [];

    for (const row of input) {
      const key = String(row.skill_id);
      if (seen.has(key)) {
        throw new BadRequestException({
          message: 'Duplicate skills are not allowed for the same job opening',
          code: 'DUPLICATE_JOB_OPENING_SKILLS',
        });
      }
      seen.add(key);
      output.push(row);
    }

    return output;
  }

  async ensureUniqueCode(options: {
    code: string;
    excludeId?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const existing = await this.jobOpeningRepository.findByCode(options.code, {
      includeDeleted: true,
      manager: options.manager,
    });

    if (existing && existing.id !== options.excludeId) {
      throw new ConflictException({
        message: 'A job opening with this code already exists',
        code: 'JOB_OPENING_CODE_ALREADY_EXISTS',
      });
    }
  }
}
