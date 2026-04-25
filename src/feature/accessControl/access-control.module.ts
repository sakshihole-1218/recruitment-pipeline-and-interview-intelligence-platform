import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesService } from './application/services/roles.service';
import { UsersService } from './application/services/users.service';
import { AssignRoleToUserUseCase } from './application/use-cases/assign-role-to-user.usecase';
import { CreateUserUseCase } from './application/use-cases/create-user.usecase';
import { FindRoleByIdUseCase } from './application/use-cases/find-role-by-id.usecase';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.usecase';
import { ListRolesUseCase } from './application/use-cases/list-roles.usecase';
import { ListUsersUseCase } from './application/use-cases/list-users.usecase';
import { RemoveRoleFromUserUseCase } from './application/use-cases/remove-role-from-user.usecase';
import { UpdateUserUseCase } from './application/use-cases/update-user.usecase';
import { RolesController } from './controllers/roles.controller';
import { UsersController } from './controllers/users.controller';
import { RoleEntity } from './entities/role.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { UserEntity } from './entities/user.entity';
import { RoleRepository } from './repositories/role.repository';
import { UserRepository } from './repositories/user.repository';
import { UserRoleRepository } from './repositories/user-role.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, UserRoleEntity])],
  controllers: [UsersController, RolesController],
  providers: [
    UserRepository,
    RoleRepository,
    UserRoleRepository,

    CreateUserUseCase,
    UpdateUserUseCase,
    FindUserByIdUseCase,
    ListUsersUseCase,

    AssignRoleToUserUseCase,
    RemoveRoleFromUserUseCase,

    ListRolesUseCase,
    FindRoleByIdUseCase,

    UsersService,
    RolesService,
  ],
  exports: [UsersService, RolesService],
})
export class AccessControlModule {}
