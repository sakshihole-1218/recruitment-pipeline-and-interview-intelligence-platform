import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  normalizeEmail,
  normalizePhoneE164,
} from '../../../common/utils/normalization.util';
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

  @ApiPropertyOptional({
    description: 'Phone number in correct format (e.g. +919876543210).',
    example: '+919000000000',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    return normalizePhoneE164(value);
  })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Phone number must be in correct format (e.g. +919876543210)',
  })
  @MaxLength(16)
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
}
