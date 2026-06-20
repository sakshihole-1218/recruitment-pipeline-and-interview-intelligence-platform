import { ApiProperty } from '@nestjs/swagger';

import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';

export class ProfileResponseDto {
  @ApiProperty({ example: 'f3a6b0ea-2b1a-4af1-a4a8-bb2b2a45a7c9' })
  id: string;

  @ApiProperty({ example: 'sakshi@example.com' })
  email: string;

  @ApiProperty({ example: 'Sakshi' })
  first_name: string;

  @ApiProperty({ example: 'Sharma' })
  last_name: string;

  @ApiProperty({ example: '+91-9000000000', nullable: true })
  phone: string | null;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z', nullable: true })
  last_login_at: Date | null;

  @ApiProperty({
    isArray: true,
    enum: SystemRoleCode,
    example: [SystemRoleCode.RECRUITER],
  })
  roles: SystemRoleCode[];

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
