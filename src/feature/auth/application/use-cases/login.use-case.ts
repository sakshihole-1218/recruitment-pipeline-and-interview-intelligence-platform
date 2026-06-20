import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { UserRepository } from '../../../accessControl/repositories/user.repository';
import { AuthResponseDto } from '../../dto/auth-response.dto';
import { LoginDto } from '../../dto/login.dto';
import { AuthMapper } from '../../helpers/auth.mapper';
import { JwtPayloadHelper } from '../../helpers/jwt-payload.helper';
import { AuthPasswordHashingHelper } from '../../helpers/password-hashing.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmailWithRoles(dto.email);

    if (!user || !user.is_active) {
      throw new UnauthorizedException({
        message: 'Email or password is incorrect',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isValidPassword = await AuthPasswordHashingHelper.verify(
      dto.password,
      user.password_hash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException({
        message: 'Email or password is incorrect',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const payload = JwtPayloadHelper.fromUser(user);

    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    ) as unknown as StringValue;
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    ) as unknown as StringValue;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', ''),
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', ''),
      expiresIn: refreshExpiresIn,
    });

    user.refresh_token_hash =
      await AuthPasswordHashingHelper.hash(refreshToken);
    user.last_login_at = new Date();
    user.updated_by_user_id = user.id;

    await this.userRepository.save(user);

    await this.activityWriter.log(
      ActivityLogBuilder.build({
        entityType: ActivityEntityType.USER,
        entityId: user.id,
        actionType: ActivityActionType.LOGIN,
        actorUserId: user.id,
        oldValues: null,
        newValues: {
          last_login_at: user.last_login_at?.toISOString?.() ?? null,
        },
        actionAt: user.last_login_at,
        ipAddress: null,
        userAgent: null,
      }),
    );

    const reloaded = await this.userRepository.findById(user.id);
    if (!reloaded) {
      throw new UnauthorizedException({
        message: 'Unable to log in right now. Please try again',
        code: 'LOGIN_FAILED',
      });
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: AuthMapper.toProfile(reloaded),
    };
  }
}
