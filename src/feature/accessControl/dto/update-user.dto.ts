import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { normalizeEmail, normalizePhoneE164 } from '../../../common/utils/normalization.util';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Sakshi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ example: 'sakshi@example.com' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    return normalizeEmail(value);
  })
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number in correct format (e.g. +919876543210). Use null to clear.',
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
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'New plain password; will be hashed and stored.',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
