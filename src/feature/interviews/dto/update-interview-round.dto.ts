import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { InterviewRoundType } from '../enums/interview-round-type.enum';

export class UpdateInterviewRoundDto {
  @ApiPropertyOptional({ example: 'Technical Round 1' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  round_name?: string;

  @ApiPropertyOptional({ enum: InterviewRoundType })
  @IsOptional()
  @IsEnum(InterviewRoundType)
  round_type?: InterviewRoundType;

  @ApiPropertyOptional({
    example: 1,
    description: '1-based order of this round',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  sequence_number?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  max_score?: number;

  @ApiPropertyOptional({ example: 'Focus on system design and scaling' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
