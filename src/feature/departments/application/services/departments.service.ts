import { Injectable } from '@nestjs/common';

import { CreateDepartmentDto } from '../../dto/create-department.dto';
import { UpdateDepartmentDto } from '../../dto/update-department.dto';
import { UpdateDepartmentStatusDto } from '../../dto/update-department-status.dto';
import { ListDepartmentsQueryDto } from '../../dto/list-departments.query.dto';
import { CreateDepartmentUseCase } from '../use-cases/create-department.usecase';
import { UpdateDepartmentUseCase } from '../use-cases/update-department.usecase';
import { FindDepartmentByIdUseCase } from '../use-cases/find-department-by-id.usecase';
import { ListDepartmentsUseCase } from '../use-cases/list-departments.usecase';
import { SoftDeleteDepartmentUseCase } from '../use-cases/soft-delete-department.usecase';
import { UpdateDepartmentStatusUseCase } from '../use-cases/update-department-status.usecase';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly createUseCase: CreateDepartmentUseCase,
    private readonly updateUseCase: UpdateDepartmentUseCase,
    private readonly updateStatusUseCase: UpdateDepartmentStatusUseCase,
    private readonly findByIdUseCase: FindDepartmentByIdUseCase,
    private readonly listUseCase: ListDepartmentsUseCase,
    private readonly softDeleteUseCase: SoftDeleteDepartmentUseCase,
  ) {}

  async create(dto: CreateDepartmentDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  async update(id: string, dto: UpdateDepartmentDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  async updateStatus(
    id: string,
    dto: UpdateDepartmentStatusDto,
    actorUserId?: string,
  ) {
    return this.updateStatusUseCase.execute(id, dto, actorUserId);
  }

  async findById(id: string) {
    return this.findByIdUseCase.execute(id);
  }

  async list(query: ListDepartmentsQueryDto) {
    return this.listUseCase.execute(query);
  }

  async softDelete(id: string, actorUserId?: string) {
    return this.softDeleteUseCase.execute(id, actorUserId);
  }
}
