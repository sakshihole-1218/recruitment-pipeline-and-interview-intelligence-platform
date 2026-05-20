import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { LogoutResponseDto } from '../dto/logout-response.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

export class AuthApiDocs {
  static tag() {
    return ApiTags('Auth');
  }

  static login() {
    return applyDecorators(
      ApiOperation({ summary: 'Login with email and password' }),
      ApiBody({ type: LoginDto }),
      ApiStandardResponse(AuthResponseDto, 'Logged in successfully'),
      ApiUnauthorizedResponse({ description: 'Invalid credentials' }),
    );
  }

  static refresh() {
    return applyDecorators(
      ApiOperation({ summary: 'Refresh access token using refresh token' }),
      ApiBody({ type: RefreshTokenDto }),
      ApiStandardResponse(AuthResponseDto, 'Token refreshed successfully'),
      ApiUnauthorizedResponse({ description: 'Invalid refresh token' }),
    );
  }

  static logout() {
    return applyDecorators(
      ApiBearerAuth('JWT-auth'),
      ApiOperation({ summary: 'Logout (clears stored refresh token)' }),
      ApiStandardResponse(LogoutResponseDto, 'Logged out successfully'),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    );
  }

  static profile() {
    return applyDecorators(
      ApiBearerAuth('JWT-auth'),
      ApiOperation({ summary: 'Get logged-in user profile' }),
      ApiStandardResponse(ProfileResponseDto, 'Profile fetched successfully'),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    );
  }
}
