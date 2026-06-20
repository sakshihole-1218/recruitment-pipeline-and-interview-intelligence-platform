import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { InterviewMode } from '../enums/interview-mode.enum';
import { InterviewStatus } from '../enums/interview-status.enum';

const INTERVIEW_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'scheduled_start_at',
  'scheduled_end_at',
  'completed_at',
  'interview_status',
] as const;

export class ListInterviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Application UUID' })
  @IsOptional()
  @IsUUID()
  application_id?: string;

  @ApiPropertyOptional({ description: 'Interview round UUID' })
  @IsOptional()
  @IsUUID()
  interview_round_id?: string;

  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsOptional()
  @IsEnum(InterviewStatus)
  interview_status?: InterviewStatus;

  @ApiPropertyOptional({ enum: InterviewMode })
  @IsOptional()
  @IsEnum(InterviewMode)
  interview_mode?: InterviewMode;

  @ApiPropertyOptional({
    description: 'Filter by scheduled_start_at >= scheduled_from',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  scheduled_from?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled_start_at <= scheduled_to',
    example: '2026-01-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  scheduled_to?: string;

  @ApiPropertyOptional({
    description: 'Filter interviews where a given user is a panel member',
  })
  @IsOptional()
  @IsUUID()
  interviewer_user_id?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: INTERVIEW_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(INTERVIEW_SORT_FIELDS)
  override sort_by?: (typeof INTERVIEW_SORT_FIELDS)[number] = 'created_at';

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
