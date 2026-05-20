import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ResponseUtil } from '../../../common/utils/response.util';
import { AuthService } from '../application/services/auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthApiDocs } from '../decorators/auth-api.decorator';
import { AuthJwtPayload } from '../helpers/jwt-payload.helper';

@AuthApiDocs.tag()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuthApiDocs.login()
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return ResponseUtil.success('Logged in successfully', result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @AuthApiDocs.refresh()
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refresh(dto);
    return ResponseUtil.success('Token refreshed successfully', result);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @AuthApiDocs.logout()
  async logout(@CurrentUser() user: AuthJwtPayload) {
    const result = await this.authService.logout(user.sub);
    return ResponseUtil.success('Logged out successfully', result);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @AuthApiDocs.profile()
  async profile(@CurrentUser() user: AuthJwtPayload) {
    const result = await this.authService.profile(user.sub);
    return ResponseUtil.success('Profile fetched successfully', result);
  }
}
