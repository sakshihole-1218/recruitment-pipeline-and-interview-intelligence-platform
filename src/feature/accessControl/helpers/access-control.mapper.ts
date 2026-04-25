import { RoleEntity } from '../entities/role.entity';
import { UserEntity } from '../entities/user.entity';
import { RoleResponseDto } from '../dto/role.response.dto';
import { UserResponseDto } from '../dto/user.response.dto';

export class AccessControlMapper {
  static toRoleResponse(role: RoleEntity): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      created_at: role.created_at,
      updated_at: role.updated_at,
    };
  }

  static toUserResponse(user: UserEntity): UserResponseDto {
    const roles = (user.user_roles || [])
      .filter((ur) => !ur.deleted_at)
      .map((ur) => ur.role)
      .filter((r): r is RoleEntity => Boolean(r))
      .map((r) => this.toRoleResponse(r));

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles,
    };
  }
}
