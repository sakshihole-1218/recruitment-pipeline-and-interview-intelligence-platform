import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { InterviewRoundType } from '../enums/interview-round-type.enum';

export class CreateInterviewRoundDto {
  @ApiProperty({ description: 'Job opening UUID' })
  @IsUUID()
  job_opening_id: string;

  @ApiProperty({ example: 'Technical Round 1' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  round_name: string;

  @ApiProperty({ enum: InterviewRoundType })
  @IsEnum(InterviewRoundType)
  round_type: InterviewRoundType;

  @ApiProperty({ example: 1, description: '1-based order of this round' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  sequence_number: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean = true;

  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum score for this round',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  max_score?: number;

  @ApiPropertyOptional({
    example: 'Focus on data structures and system design',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
