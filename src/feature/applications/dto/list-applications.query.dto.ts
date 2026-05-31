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

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

const APPLICATION_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'applied_at',
  'application_number',
  'last_stage_changed_at',
  'current_stage',
  'application_status',
  'is_priority',
] as const;

export class ListApplicationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ example: 'APP-2026-000001' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(30)
  application_number?: string;

  @ApiPropertyOptional({ description: 'Candidate UUID' })
  @IsOptional()
  @IsUUID()
  candidate_id?: string;

  @ApiPropertyOptional({ description: 'Job opening UUID' })
  @IsOptional()
  @IsUUID()
  job_opening_id?: string;

  @ApiPropertyOptional({ enum: ApplicationCurrentStage })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(ApplicationCurrentStage)
  current_stage?: ApplicationCurrentStage;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(ApplicationStatus)
  application_status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Assigned recruiter user UUID' })
  @IsOptional()
  @IsUUID()
  assigned_recruiter_user_id?: string;

  @ApiPropertyOptional({ description: 'Assigned hiring manager user UUID' })
  @IsOptional()
  @IsUUID()
  assigned_hiring_manager_user_id?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value, obj, key }) => {
    const raw = (obj as Record<string, unknown> | undefined)?.[String(key)];
    if (raw === 'true' || raw === true) return true;
    if (raw === 'false' || raw === false) return false;
    return value;
  })
  @IsBoolean()
  is_priority?: boolean;

  @ApiPropertyOptional({
    description: 'Filter applications applied at or after this timestamp (ISO8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  applied_from?: string;

  @ApiPropertyOptional({
    description: 'Filter applications applied at or before this timestamp (ISO8601)',
    example: '2026-01-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  applied_to?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: APPLICATION_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(APPLICATION_SORT_FIELDS)
  override sort_by?: (typeof APPLICATION_SORT_FIELDS)[number] = 'created_at';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(['asc', 'desc'])
  override sort_order?: 'asc' | 'desc' = 'desc';
}
