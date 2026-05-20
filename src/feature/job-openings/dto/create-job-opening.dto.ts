import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
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
  ValidateNested,
} from 'class-validator';

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { EmploymentType } from '../enums/employment-type.enum';
import { WorkMode } from '../enums/work-mode.enum';
import { JobOpeningStatus } from '../enums/job-opening-status.enum';
import { JobOpeningSkillInputDto } from './job-opening-skill.input.dto';

export class CreateJobOpeningDto {
  @ApiProperty({ example: 'Senior Backend Engineer' })
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'BE-2026-001', description: 'Unique job opening code' })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Department UUID' })
  @IsUUID()
  department_id: string;

  @ApiProperty({ description: 'Hiring manager user UUID' })
  @IsUUID()
  hiring_manager_user_id: string;

  @ApiProperty({ description: 'Recruiter user UUID' })
  @IsUUID()
  recruiter_user_id: string;

  @ApiProperty({ enum: EmploymentType, example: EmploymentType.FULL_TIME })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(EmploymentType)
  employment_type: EmploymentType;

  @ApiProperty({ enum: WorkMode, example: WorkMode.HYBRID })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(WorkMode)
  work_mode: WorkMode;

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

  @ApiPropertyOptional({ example: 1500000, description: 'Minimum annual salary' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  min_salary?: number;

  @ApiPropertyOptional({ example: 2800000, description: 'Maximum annual salary' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  max_salary?: number;

  @ApiPropertyOptional({ example: 'INR', description: 'ISO currency code' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? value : String(value).trim().toUpperCase()))
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  currency_code?: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  openings_count: number;

  @ApiPropertyOptional({ example: 'Role overview and impact' })
  @IsOptional()
  @IsString()
  job_description?: string;

  @ApiPropertyOptional({ example: 'Build and scale APIs' })
  @IsOptional()
  @IsString()
  responsibilities?: string;

  @ApiPropertyOptional({ example: 'Strong Node.js and PostgreSQL skills' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ example: 'Bengaluru, IN' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    enum: JobOpeningStatus,
    example: JobOpeningStatus.DRAFT,
    description: 'Defaults to DRAFT when omitted',
  })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(JobOpeningStatus)
  status?: JobOpeningStatus;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: [JobOpeningSkillInputDto],
    description: 'Required skills for the opening (deduplicated by skill_id)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobOpeningSkillInputDto)
  skills?: JobOpeningSkillInputDto[];
}
