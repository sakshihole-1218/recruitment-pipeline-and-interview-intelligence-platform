import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

import { ProctoringEventType } from '../enums/proctoring-event-type.enum';
import { ProctoringSeverity } from '../enums/proctoring-severity.enum';

const INTERVIEW_PROCTORING_EVENT_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'occurred_at',
  'severity',
  'event_type',
  'is_resolved',
] as const;

export class InterviewProctoringEventQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for occurred_at. When provided, cursor pagination is used and sort_by must be occurred_at.',
    example: '2026-06-06T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'AI interview session UUID' })
  @IsOptional()
  @IsUUID()
  ai_interview_session_id?: string;

  @ApiPropertyOptional({ description: 'Application UUID' })
  @IsOptional()
  @IsUUID()
  application_id?: string;

  @ApiPropertyOptional({ description: 'Candidate UUID' })
  @IsOptional()
  @IsUUID()
  candidate_id?: string;

  @ApiPropertyOptional({ enum: ProctoringEventType })
  @IsOptional()
  @IsEnum(ProctoringEventType)
  event_type?: ProctoringEventType;

  @ApiPropertyOptional({ enum: ProctoringSeverity })
  @IsOptional()
  @IsEnum(ProctoringSeverity)
  severity?: ProctoringSeverity;

  @ApiPropertyOptional({ description: 'Filter resolved or unresolved events' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }

    const normalized = String(value).toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  is_resolved?: boolean;

  @ApiPropertyOptional({ description: 'Occurred at start date (ISO8601)' })
  @IsOptional()
  @IsISO8601()
  occurred_from?: string;

  @ApiPropertyOptional({ description: 'Occurred at end date (ISO8601)' })
  @IsOptional()
  @IsISO8601()
  occurred_to?: string;

  @ApiPropertyOptional({
    example: 'occurred_at',
    enum: INTERVIEW_PROCTORING_EVENT_SORT_FIELDS,
    default: 'occurred_at',
  })
  @IsOptional()
  @IsIn(INTERVIEW_PROCTORING_EVENT_SORT_FIELDS)
  override sort_by?: (typeof INTERVIEW_PROCTORING_EVENT_SORT_FIELDS)[number] = 'occurred_at';

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
