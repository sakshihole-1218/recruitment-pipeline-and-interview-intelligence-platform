import { Injectable } from '@nestjs/common';

import { ListRolesQueryDto } from '../../dto/list-roles.query.dto';
import { RoleEntity } from '../../entities/role.entity';
import { FindRoleByIdUseCase } from '../use-cases/find-role-by-id.usecase';
import { ListRolesUseCase } from '../use-cases/list-roles.usecase';

@Injectable()
export class RolesService {
  constructor(
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly findRoleByIdUseCase: FindRoleByIdUseCase,
  ) {}

  async list(query: ListRolesQueryDto): Promise<{
    data: RoleEntity[];
    page: number;
    limit: number;
    total_records: number;
  }> {
    return this.listRolesUseCase.execute(query);
  }

  async findById(id: string): Promise<RoleEntity> {
    return this.findRoleByIdUseCase.execute(id);
  }
}
