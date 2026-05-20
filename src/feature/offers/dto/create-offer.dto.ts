import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { normalizeSearch } from '../../../common/utils/normalization.util';

export class CreateOfferDto {
  @ApiProperty({ description: 'Application UUID' })
  @IsUUID()
  application_id: string;

  @ApiProperty({ example: 'Senior Backend Engineer' })
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  offered_role_title: string;

  @ApiProperty({ example: 2800000, description: 'Annual offered CTC (must be > 0)' })
  @Type(() => Number)
  @Min(0.01)
  offered_ctc: number;

  @ApiPropertyOptional({ example: 100000, description: 'Joining bonus (>= 0)' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  joining_bonus?: number;

  @ApiPropertyOptional({ example: 'INR', description: 'ISO currency code' })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null ? value : String(value).trim().toUpperCase(),
  )
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  currency_code?: string;

  @ApiPropertyOptional({ example: 6, description: 'Probation period months (>= 0)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  probation_period_months?: number;

  @ApiProperty({
    example: '2026-12-01T00:00:00.000Z',
    description: 'Expected joining date (future date required)'
  })
  @IsISO8601()
  expected_joining_date: string;
}
