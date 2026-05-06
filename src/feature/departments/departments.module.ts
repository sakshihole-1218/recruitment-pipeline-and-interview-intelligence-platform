import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DepartmentsController } from './controllers/departments.controller';
import { DepartmentsService } from './application/services/departments.service';
import { DepartmentEntity } from './entities/department.entity';
import { DepartmentRepository } from './repositories/department.repository';
import { DepartmentsValidationHelper } from './helpers/departments-validation.helper';
import { DepartmentsPaginationHelper } from './helpers/departments-pagination.helper';
import { CreateDepartmentUseCase } from './application/use-cases/create-department.usecase';
import { UpdateDepartmentUseCase } from './application/use-cases/update-department.usecase';
import { FindDepartmentByIdUseCase } from './application/use-cases/find-department-by-id.usecase';
import { ListDepartmentsUseCase } from './application/use-cases/list-departments.usecase';
import { SoftDeleteDepartmentUseCase } from './application/use-cases/soft-delete-department.usecase';
import { UpdateDepartmentStatusUseCase } from './application/use-cases/update-department-status.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([DepartmentEntity])],
  controllers: [DepartmentsController],
  providers: [
    DepartmentRepository,
    DepartmentsValidationHelper,
    DepartmentsPaginationHelper,
    // use-cases
    CreateDepartmentUseCase,
    UpdateDepartmentUseCase,
    UpdateDepartmentStatusUseCase,
    FindDepartmentByIdUseCase,
    ListDepartmentsUseCase,
    SoftDeleteDepartmentUseCase,
    // service
    DepartmentsService,
  ],
  exports: [DepartmentsService, DepartmentRepository],
})
export class DepartmentsModule {}
