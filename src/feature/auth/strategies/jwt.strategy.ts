import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRepository } from '../../accessControl/repositories/user.repository';
import { AuthJwtPayload, JwtPayloadHelper } from '../helpers/jwt-payload.helper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: AuthJwtPayload): Promise<AuthJwtPayload> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.is_active) {
      throw new UnauthorizedException({
        message: 'Please log in to continue',
        code: 'UNAUTHORIZED',
      });
    }

    return JwtPayloadHelper.fromUser(user);
  }
}
