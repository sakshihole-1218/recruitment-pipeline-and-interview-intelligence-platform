import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { UserEntity } from '../../accessControl/entities/user.entity';

export interface AuthJwtPayload {
  sub: string;
  email: string;
  roles: SystemRoleCode[];
}

export class JwtPayloadHelper {
  static fromUser(user: UserEntity): AuthJwtPayload {
    const roles = (user.user_roles || [])
      .map((ur) => ur.role?.code)
      .filter(Boolean) as SystemRoleCode[];

    return {
      sub: user.id,
      email: user.email,
      roles: Array.from(new Set(roles)),
    };
  }
}
