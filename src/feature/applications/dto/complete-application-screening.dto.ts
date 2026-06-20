import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { ScreeningResult } from '../enums/screening-result.enum';

export class CompleteApplicationScreeningDto {
  @ApiProperty({ example: 78.5, description: 'Screening score (0-100)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  screening_score: number;

  @ApiProperty({ example: 82.25, description: 'Fit score (0-100)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  fit_score: number;

  @ApiPropertyOptional({
    example: 'Good communication, strong system design fundamentals',
    description:
      'Optional screening remarks (stored as stage change reason and/or rejection reason based on result)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  screening_remarks?: string;

  @ApiProperty({ enum: ScreeningResult, example: ScreeningResult.SHORTLISTED })
  @IsEnum(ScreeningResult)
  screening_result: ScreeningResult;
}
