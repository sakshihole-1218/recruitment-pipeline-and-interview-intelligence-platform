import { Injectable } from '@nestjs/common';

import { ListUsersQueryDto } from '../../dto/list-users.query.dto';
import { UserRepository, UserListResult } from '../../repositories/user.repository';
import { AccessControlPaginationHelper } from '../../helpers/access-control-pagination.helper';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: ListUsersQueryDto): Promise<UserListResult> {
    AccessControlPaginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
    });

    return this.userRepository.list(query);
  }
}
