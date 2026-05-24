import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsUUID,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

import { ResumeAiAnalysisStatus } from '../enums/resume-ai-analysis-status.enum';

const RESUME_AI_ANALYSIS_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'analyzed_at',
  'analysis_status',
] as const;

export class ListResumeAiAnalysesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Filter by candidate document UUID' })
  @IsOptional()
  @IsUUID()
  candidate_document_id?: string;

  @ApiPropertyOptional({ enum: ResumeAiAnalysisStatus })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(ResumeAiAnalysisStatus)
  analysis_status?: ResumeAiAnalysisStatus;

  @ApiPropertyOptional({
    description: 'Filter analyses with analyzed_at >= this date (ISO)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  analyzed_from?: string;

  @ApiPropertyOptional({
    description: 'Filter analyses with analyzed_at <= this date (ISO)',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  analyzed_to?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: RESUME_AI_ANALYSIS_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(RESUME_AI_ANALYSIS_SORT_FIELDS)
  override sort_by?: (typeof RESUME_AI_ANALYSIS_SORT_FIELDS)[number] =
    'created_at';
}
