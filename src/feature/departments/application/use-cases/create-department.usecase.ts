import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateDepartmentDto } from '../../dto/create-department.dto';
import { DepartmentEntity } from '../../entities/department.entity';
import { DepartmentRepository } from '../../repositories/department.repository';
import { DepartmentsValidationHelper } from '../../helpers/departments-validation.helper';

@Injectable()
export class CreateDepartmentUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly departmentRepository: DepartmentRepository,
    private readonly validationHelper: DepartmentsValidationHelper,
  ) {}

  async execute(
    dto: CreateDepartmentDto,
    actorUserId?: string,
  ): Promise<DepartmentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const code = this.validationHelper.normalizeCode(dto.code);
      const name = this.validationHelper.normalizeName(dto.name);

      await this.validationHelper.ensureUniqueCode({ code, manager });
      await this.validationHelper.ensureUniqueName({ name, manager });

      const created = await this.departmentRepository.createAndSave(
        {
          name,
          code,
          description: dto.description ?? null,
          is_active: dto.is_active ?? true,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const loaded = await this.departmentRepository.findById(created.id, {
        manager,
      });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'DEPARTMENT_POST_CREATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
