import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthJwtPayload } from '../helpers/jwt-payload.helper';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthJwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthJwtPayload;
  },
);
