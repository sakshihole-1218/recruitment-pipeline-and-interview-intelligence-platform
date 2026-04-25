import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { UserRepository } from '../../../accessControl/repositories/user.repository';
import { AuthResponseDto } from '../../dto/auth-response.dto';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';
import { AuthMapper } from '../../helpers/auth.mapper';
import { AuthJwtPayload, JwtPayloadHelper } from '../../helpers/jwt-payload.helper';
import { AuthPasswordHashingHelper } from '../../helpers/password-hashing.helper';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    let payload: AuthJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthJwtPayload>(
        dto.refresh_token,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET', ''),
        },
      );
    } catch {
      throw new UnauthorizedException({
        message: 'Your session has expired. Please log in again',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.is_active || !user.refresh_token_hash) {
      throw new UnauthorizedException({
        message: 'Your session has expired. Please log in again',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    const matches = await AuthPasswordHashingHelper.verify(
      dto.refresh_token,
      user.refresh_token_hash,
    );

    if (!matches) {
      throw new UnauthorizedException({
        message: 'Your session has expired. Please log in again',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    ) as unknown as StringValue;
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    ) as unknown as StringValue;

    const newPayload = JwtPayloadHelper.fromUser(user);

    const accessToken = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', ''),
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', ''),
      expiresIn: refreshExpiresIn,
    });

    user.refresh_token_hash = await AuthPasswordHashingHelper.hash(refreshToken);
    user.updated_by_user_id = user.id;

    await this.userRepository.save(user);

    const reloaded = await this.userRepository.findById(user.id);
    if (!reloaded) {
      throw new UnauthorizedException({
        message: 'Your session has expired. Please log in again',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: AuthMapper.toProfile(reloaded),
    };
  }
}
