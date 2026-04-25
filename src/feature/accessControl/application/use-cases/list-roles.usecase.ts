import { Injectable } from '@nestjs/common';

import { ListRolesQueryDto } from '../../dto/list-roles.query.dto';
import { RoleEntity } from '../../entities/role.entity';
import { RoleRepository } from '../../repositories/role.repository';

@Injectable()
export class ListRolesUseCase {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(query: ListRolesQueryDto): Promise<{
    data: RoleEntity[];
    page: number;
    limit: number;
    total_records: number;
  }> {
    return this.roleRepository.list(query);
  }
}
