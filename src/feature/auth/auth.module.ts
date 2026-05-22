import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AccessControlModule } from '../accessControl/access-control.module';
import { ActivityLogsModule } from '../activityLogs/activity-logs.module';
import { AuthService } from './application/services/auth.service';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { AuthController } from './controllers/auth.controller';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    AccessControlModule,
    ActivityLogsModule,
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetProfileUseCase,

    AuthService,

    JwtStrategy,
    RolesGuard,
  ],
  exports: [JwtStrategy, RolesGuard],
})
export class AuthModule {}
