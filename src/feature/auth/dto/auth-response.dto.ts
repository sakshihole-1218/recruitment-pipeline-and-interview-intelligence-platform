import { ApiProperty } from '@nestjs/swagger';

import { ProfileResponseDto } from './profile-response.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (short-lived)' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token (long-lived)' })
  refresh_token: string;

  @ApiProperty({ type: ProfileResponseDto })
  user: ProfileResponseDto;
}
