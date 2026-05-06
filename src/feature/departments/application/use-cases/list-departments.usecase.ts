import { Injectable } from '@nestjs/common';

import { ListDepartmentsQueryDto } from '../../dto/list-departments.query.dto';
import {
  DepartmentListResult,
  DepartmentRepository,
} from '../../repositories/department.repository';
import { DepartmentsPaginationHelper } from '../../helpers/departments-pagination.helper';

@Injectable()
export class ListDepartmentsUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly paginationHelper: DepartmentsPaginationHelper,
  ) {}

  async execute(query: ListDepartmentsQueryDto): Promise<DepartmentListResult> {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });

    return this.departmentRepository.list(query);
  }
}
