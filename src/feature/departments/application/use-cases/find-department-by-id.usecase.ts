import { Injectable, NotFoundException } from '@nestjs/common';

import { DepartmentEntity } from '../../entities/department.entity';
import { DepartmentRepository } from '../../repositories/department.repository';

@Injectable()
export class FindDepartmentByIdUseCase {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(id: string): Promise<DepartmentEntity> {
    const department = await this.departmentRepository.findById(id);

    if (!department) {
      throw new NotFoundException({
        message: 'Department not found',
        code: 'DEPARTMENT_NOT_FOUND',
      });
    }

    return department;
  }
}
