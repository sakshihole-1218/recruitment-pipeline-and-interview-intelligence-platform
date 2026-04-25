import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { RoleResponseDto } from './role.response.dto';

export class UserResponseDto {
  @ApiProperty({ example: '9c0a8c8f-820a-45c8-a95f-9cdbad8ffcc4' })
  id: string;

  @ApiProperty({ example: 'Sakshi' })
  first_name: string;

  @ApiProperty({ example: 'Sharma' })
  last_name: string;

  @ApiProperty({ example: 'sakshi@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+91-9000000000' })
  phone: string | null;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiPropertyOptional({ example: '2026-01-15T10:30:00.000Z' })
  last_login_at: Date | null;

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-02T12:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: [RoleResponseDto] })
  roles?: RoleResponseDto[];
}
