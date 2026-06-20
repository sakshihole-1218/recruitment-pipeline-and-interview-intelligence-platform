import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { EmploymentType } from '../enums/employment-type.enum';
import { WorkMode } from '../enums/work-mode.enum';
import { JobOpeningStatus } from '../enums/job-opening-status.enum';

export class UpdateJobOpeningDto {
  @ApiPropertyOptional({ example: 'Senior Backend Engineer' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'BE-2026-001' })
  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Department UUID' })
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional({ description: 'Hiring manager user UUID' })
  @IsOptional()
  @IsUUID()
  hiring_manager_user_id?: string;

  @ApiPropertyOptional({ description: 'Recruiter user UUID' })
  @IsOptional()
  @IsUUID()
  recruiter_user_id?: string;

  @ApiPropertyOptional({
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @ApiPropertyOptional({ enum: WorkMode, example: WorkMode.HYBRID })
  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(WorkMode)
  work_mode?: WorkMode;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experience_min_years?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experience_max_years?: number;

  @ApiPropertyOptional({ example: 1500000 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  min_salary?: number;

  @ApiPropertyOptional({ example: 2800000 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  max_salary?: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? value
      : String(value).trim().toUpperCase(),
  )
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  currency_code?: string | null;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  openings_count?: number;

  @ApiPropertyOptional({ example: 'Role overview and impact' })
  @IsOptional()
  @IsString()
  job_description?: string | null;

  @ApiPropertyOptional({ example: 'Build and scale APIs' })
  @IsOptional()
  @IsString()
  responsibilities?: string | null;

  @ApiPropertyOptional({ example: 'Strong Node.js and PostgreSQL skills' })
  @IsOptional()
  @IsString()
  requirements?: string | null;

  @ApiPropertyOptional({ example: 'Bengaluru, IN' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @ApiPropertyOptional({
    enum: JobOpeningStatus,
    example: JobOpeningStatus.OPEN,
  })
  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(JobOpeningStatus)
  status?: JobOpeningStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;
}
