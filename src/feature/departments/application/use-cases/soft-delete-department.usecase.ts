import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { DepartmentRepository } from '../../repositories/department.repository';

@Injectable()
export class SoftDeleteDepartmentUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly departmentRepository: DepartmentRepository,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
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

      department.deleted_at = new Date();
      department.deleted_by_user_id = actorUserId ?? null;
      department.updated_by_user_id = actorUserId ?? department.updated_by_user_id;

      await this.departmentRepository.save(department, { manager });

      const loaded = await this.departmentRepository.findById(id, { manager });
      if (loaded) {
        throw new ConflictException({
          message: 'We could not delete the department. Please try again',
          code: 'DEPARTMENT_SOFT_DELETE_FAILED',
        });
      }
    });
  }
}
