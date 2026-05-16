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
import { InterviewRecommendation } from '../enums/interview-recommendation.enum';

const FEEDBACK_SORT_FIELDS = ['created_at', 'updated_at', 'submitted_at'] as const;

export class ListInterviewFeedbackQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Filter by interview UUID' })
  @IsOptional()
  @IsUUID()
  interview_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by application UUID (via interviews.application_id)',
  })
  @IsOptional()
  @IsUUID()
  application_id?: string;

  @ApiPropertyOptional({ description: 'Filter by interviewer user UUID' })
  @IsOptional()
  @IsUUID()
  interviewer_user_id?: string;

  @ApiPropertyOptional({ enum: InterviewRecommendation })
  @IsOptional()
  @IsEnum(InterviewRecommendation)
  recommendation?: InterviewRecommendation;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: FEEDBACK_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(FEEDBACK_SORT_FIELDS)
  override sort_by?: (typeof FEEDBACK_SORT_FIELDS)[number] = 'created_at';

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
