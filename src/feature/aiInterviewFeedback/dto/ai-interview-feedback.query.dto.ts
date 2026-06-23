import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

import { AiInterviewFeedbackStatus } from '../enums/ai-interview-feedback-status.enum';
import { AiInterviewRecommendation } from '../enums/ai-interview-recommendation.enum';

const AI_INTERVIEW_FEEDBACK_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'generated_at',
  'overall_score',
  'feedback_status',
  'recommendation',
] as const;

export class AiInterviewFeedbackQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and sort_by must be created_at.',
    example: '2026-06-06T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({
    description:
      'Search across summaries, detailed feedback, strengths, weaknesses and failure reason',
  })
  @IsOptional()
  @IsString()
  search?: string;

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

  @ApiPropertyOptional({ description: 'Resume analysis UUID' })
  @IsOptional()
  @IsUUID()
  resume_analysis_id?: string;

  @ApiPropertyOptional({ enum: AiInterviewFeedbackStatus })
  @IsOptional()
  @IsEnum(AiInterviewFeedbackStatus)
  feedback_status?: AiInterviewFeedbackStatus;

  @ApiPropertyOptional({ enum: AiInterviewRecommendation })
  @IsOptional()
  @IsEnum(AiInterviewRecommendation)
  recommendation?: AiInterviewRecommendation;

  @ApiPropertyOptional({ description: 'Generated at start date (ISO8601)' })
  @IsOptional()
  @IsISO8601()
  generated_from?: string;

  @ApiPropertyOptional({ description: 'Generated at end date (ISO8601)' })
  @IsOptional()
  @IsISO8601()
  generated_to?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: AI_INTERVIEW_FEEDBACK_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(AI_INTERVIEW_FEEDBACK_SORT_FIELDS)
  override sort_by?: (typeof AI_INTERVIEW_FEEDBACK_SORT_FIELDS)[number] =
    'created_at';

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
