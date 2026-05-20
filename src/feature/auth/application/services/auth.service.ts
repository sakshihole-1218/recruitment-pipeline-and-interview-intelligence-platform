import { Injectable } from '@nestjs/common';

import { AuthResponseDto } from '../../dto/auth-response.dto';
import { LoginDto } from '../../dto/login.dto';
import { LogoutResponseDto } from '../../dto/logout-response.dto';
import { ProfileResponseDto } from '../../dto/profile-response.dto';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';
import { GetProfileUseCase } from '../use-cases/get-profile.use-case';
import { LoginUseCase } from '../use-cases/login.use-case';
import { LogoutUseCase } from '../use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../use-cases/refresh-token.use-case';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
  ) {}

  login(dto: LoginDto): Promise<AuthResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.refreshTokenUseCase.execute(dto);
  }

  async logout(userId: string): Promise<LogoutResponseDto> {
    await this.logoutUseCase.execute(userId);
    return { logged_out: true };
  }

  profile(userId: string): Promise<ProfileResponseDto> {
    return this.getProfileUseCase.execute(userId);
  }
}
