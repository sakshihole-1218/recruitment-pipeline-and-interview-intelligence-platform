import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { DepartmentRepository } from '../repositories/department.repository';
import { normalizeSearch } from '../../../common/utils/normalization.util';

@Injectable()
export class DepartmentsValidationHelper {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  normalizeCode(code: string): string {
    const normalized = String(code ?? '').trim();
    if (!normalized) {
      throw new BadRequestException({
        message: 'Department code is required',
        code: 'DEPARTMENT_CODE_REQUIRED',
      });
    }
    return normalized.toUpperCase();
  }

  normalizeName(name: string): string {
    const normalized = normalizeSearch(name);
    if (!normalized) {
      throw new BadRequestException({
        message: 'Department name is required',
        code: 'DEPARTMENT_NAME_REQUIRED',
      });
    }
    return normalized;
  }

  async ensureUniqueCode(options: {
    code: string;
    excludeId?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const existing = await this.departmentRepository.findByCode(
      options.code,
      {
        includeDeleted: false,
        manager: options.manager,
      },
    );

    if (existing && existing.id !== options.excludeId) {
      throw new ConflictException({
        message: 'A department with this code already exists',
        code: 'DEPARTMENT_CODE_ALREADY_EXISTS',
      });
    }
  }

  async ensureUniqueName(options: {
    name: string;
    excludeId?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const existing = await this.departmentRepository.findByName(options.name, {
      includeDeleted: false,
      manager: options.manager,
    });

    if (existing && existing.id !== options.excludeId) {
      throw new ConflictException({
        message: 'A department with this name already exists',
        code: 'DEPARTMENT_NAME_ALREADY_EXISTS',
      });
    }
  }
}
