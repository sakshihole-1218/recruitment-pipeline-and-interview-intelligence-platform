import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateDepartmentStatusDto } from '../../dto/update-department-status.dto';
import { DepartmentEntity } from '../../entities/department.entity';
import { DepartmentRepository } from '../../repositories/department.repository';

@Injectable()
export class UpdateDepartmentStatusUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly departmentRepository: DepartmentRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateDepartmentStatusDto,
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

      department.is_active = dto.is_active;
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
