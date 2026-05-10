import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { normalizeSearch } from '../../../common/utils/normalization.util';
import { EmploymentType } from '../enums/employment-type.enum';
import { WorkMode } from '../enums/work-mode.enum';
import { JobOpeningStatus } from '../enums/job-opening-status.enum';

const JOB_OPENING_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'title',
  'code',
  'status',
  'published_at',
  'closed_at',
  'is_active',
] as const;

export class ListJobOpeningsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ example: 'backend', description: 'Filter by title (partial match)' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'BE-2026-001', description: 'Filter by job opening code' })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Department UUID' })
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional({ description: 'Recruiter user UUID' })
  @IsOptional()
  @IsUUID()
  recruiter_user_id?: string;

  @ApiPropertyOptional({ description: 'Hiring manager user UUID' })
  @IsOptional()
  @IsUUID()
  hiring_manager_user_id?: string;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @ApiPropertyOptional({ enum: WorkMode })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(WorkMode)
  work_mode?: WorkMode;

  @ApiPropertyOptional({ enum: JobOpeningStatus })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
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

  @ApiPropertyOptional({
    example: 'created_at',
    enum: JOB_OPENING_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(JOB_OPENING_SORT_FIELDS)
  override sort_by?: (typeof JOB_OPENING_SORT_FIELDS)[number] = 'created_at';
}
