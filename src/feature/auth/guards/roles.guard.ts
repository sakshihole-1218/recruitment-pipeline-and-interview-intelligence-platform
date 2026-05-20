import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthJwtPayload } from '../helpers/jwt-payload.helper';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthJwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException({
        message: 'You do not have permission to perform this action',
        code: 'ACCESS_DENIED',
      });
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role as any));

    if (!hasRole) {
      throw new ForbiddenException({
        message: 'You do not have permission to perform this action',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    return true;
  }
}
