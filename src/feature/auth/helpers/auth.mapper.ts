import { UserEntity } from '../../accessControl/entities/user.entity';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';

import { ProfileResponseDto } from '../dto/profile-response.dto';

export class AuthMapper {
  static toProfile(user: UserEntity): ProfileResponseDto {
    const roleCodes = (user.user_roles || [])
      .map((ur) => ur.role?.code)
      .filter(Boolean) as SystemRoleCode[];

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      roles: Array.from(new Set(roleCodes)),
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
