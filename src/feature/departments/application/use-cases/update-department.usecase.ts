import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateDepartmentDto } from '../../dto/update-department.dto';
import { DepartmentEntity } from '../../entities/department.entity';
import { DepartmentRepository } from '../../repositories/department.repository';
import { DepartmentsValidationHelper } from '../../helpers/departments-validation.helper';

@Injectable()
export class UpdateDepartmentUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly departmentRepository: DepartmentRepository,
    private readonly validationHelper: DepartmentsValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: UpdateDepartmentDto,
    actorUserId?: string,
  ): Promise<DepartmentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const department = await this.departmentRepository.findById(id, {
        manager,
      });

      if (!department) {
        throw new NotFoundException({
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND',
        });
      }

      if (dto.code !== undefined) {
        const code = this.validationHelper.normalizeCode(dto.code);
        await this.validationHelper.ensureUniqueCode({
          code,
          excludeId: department.id,
          manager,
        });
        department.code = code;
      }

      if (dto.name !== undefined) {
        const name = this.validationHelper.normalizeName(dto.name);
        await this.validationHelper.ensureUniqueName({
          name,
          excludeId: department.id,
          manager,
        });
        department.name = name;
      }

      if (dto.description !== undefined) {
        department.description = dto.description ?? null;
      }

      if (dto.is_active !== undefined) {
        department.is_active = dto.is_active;
      }

      if (actorUserId) {
        department.updated_by_user_id = actorUserId;
      }

      await this.departmentRepository.save(department, { manager });

      const updated = await this.departmentRepository.findById(department.id, {
        manager,
      });
      if (!updated) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'DEPARTMENT_POST_UPDATE_LOAD_FAILED',
        });
      }

      return updated;
    });
  }
}
