import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ description: 'Candidate UUID' })
  @IsUUID()
  candidate_id: string;

  @ApiProperty({ description: 'Job opening UUID' })
  @IsUUID()
  job_opening_id: string;

  @ApiPropertyOptional({ description: 'Assigned recruiter user UUID' })
  @IsOptional()
  @IsUUID()
  assigned_recruiter_user_id?: string;

  @ApiPropertyOptional({ description: 'Assigned hiring manager user UUID' })
  @IsOptional()
  @IsUUID()
  assigned_hiring_manager_user_id?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_priority?: boolean;

  @ApiPropertyOptional({ example: 75.5, description: 'Optional screening score (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  screening_score?: number;

  @ApiPropertyOptional({ example: 82.25, description: 'Optional fit score (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  fit_score?: number;
}
