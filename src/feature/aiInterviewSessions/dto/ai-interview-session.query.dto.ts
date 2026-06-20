import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AiInterviewSessionStatus } from '../enums/ai-interview-session-status.enum';
import { QuestionGenerationStatus } from '../enums/question-generation-status.enum';
import { FeedbackGenerationStatus } from '../enums/feedback-generation-status.enum';

const AI_INTERVIEW_SESSION_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'started_at',
  'ended_at',
  'session_status',
  'question_generation_status',
  'feedback_generation_status',
] as const;

export class AiInterviewSessionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Search by session_code / room / reason',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Interview UUID' })
  @IsOptional()
  @IsUUID()
  interview_id?: string;

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

  @ApiPropertyOptional({ enum: AiInterviewSessionStatus })
  @IsOptional()
  @IsEnum(AiInterviewSessionStatus)
  session_status?: AiInterviewSessionStatus;

  @ApiPropertyOptional({ enum: QuestionGenerationStatus })
  @IsOptional()
  @IsEnum(QuestionGenerationStatus)
  question_generation_status?: QuestionGenerationStatus;

  @ApiPropertyOptional({ enum: FeedbackGenerationStatus })
  @IsOptional()
  @IsEnum(FeedbackGenerationStatus)
  feedback_generation_status?: FeedbackGenerationStatus;

  @ApiPropertyOptional({
    description: 'Filter by started_at >= started_from',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  started_from?: string;

  @ApiPropertyOptional({
    description: 'Filter by started_at <= started_to',
    example: '2026-01-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  started_to?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: AI_INTERVIEW_SESSION_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(AI_INTERVIEW_SESSION_SORT_FIELDS)
  override sort_by?: (typeof AI_INTERVIEW_SESSION_SORT_FIELDS)[number] =
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
