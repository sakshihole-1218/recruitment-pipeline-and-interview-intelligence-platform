import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { normalizeEmail } from '../../../common/utils/normalization.util';

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

  @ApiPropertyOptional({ example: '+91-9000000000' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : null;
  })
  @IsString()
  @MaxLength(25)
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
