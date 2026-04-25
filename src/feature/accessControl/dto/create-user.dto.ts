import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { normalizeEmail } from '../../../common/utils/normalization.util';
import { SystemRoleCode } from '../enums/system-role-code.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Sakshi' })
  @IsString()
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @MaxLength(100)
  last_name: string;

  @ApiProperty({ example: 'sakshi@example.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: '+91-9000000000' })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone?: string;

  @ApiProperty({
    description: 'Plain password; will be hashed and stored as password_hash.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({
    description: 'Assign initial roles by code. Transaction-safe.',
    enum: SystemRoleCode,
    isArray: true,
    example: [SystemRoleCode.RECRUITER],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SystemRoleCode, { each: true })
  role_codes?: SystemRoleCode[];

  @ApiPropertyOptional({
    description:
      'Optional audit field. Typically derived from authenticated user.',
    example: 'f3a6b0ea-2b1a-4af1-a4a8-bb2b2a45a7c9',
  })
  @IsOptional()
  @IsUUID()
  created_by_user_id?: string;
}
