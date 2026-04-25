import { Injectable } from '@nestjs/common';

import { CreateUserDto } from '../../dto/create-user.dto';
import { ListUsersQueryDto } from '../../dto/list-users.query.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserEntity } from '../../entities/user.entity';
import { AssignRoleToUserUseCase } from '../use-cases/assign-role-to-user.usecase';
import { CreateUserUseCase } from '../use-cases/create-user.usecase';
import { FindUserByIdUseCase } from '../use-cases/find-user-by-id.usecase';
import { ListUsersUseCase } from '../use-cases/list-users.usecase';
import { RemoveRoleFromUserUseCase } from '../use-cases/remove-role-from-user.usecase';
import { UpdateUserUseCase } from '../use-cases/update-user.usecase';

@Injectable()
export class UsersService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly assignRoleUseCase: AssignRoleToUserUseCase,
    private readonly removeRoleUseCase: RemoveRoleFromUserUseCase,
  ) {}

  async create(dto: CreateUserDto, actorUserId?: string): Promise<UserEntity> {
    return this.createUserUseCase.execute(dto, actorUserId);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorUserId?: string,
  ): Promise<UserEntity> {
    return this.updateUserUseCase.execute(id, dto, actorUserId);
  }

  async findById(id: string): Promise<UserEntity> {
    return this.findUserByIdUseCase.execute(id);
  }

  async list(query: ListUsersQueryDto) {
    return this.listUsersUseCase.execute(query);
  }

  async assignRole(userId: string, roleId: string) {
    await this.assignRoleUseCase.execute(userId, roleId);
    return this.findUserByIdUseCase.execute(userId);
  }

  async removeRole(userId: string, roleId: string) {
    await this.removeRoleUseCase.execute(userId, roleId);
    return this.findUserByIdUseCase.execute(userId);
  }
}
