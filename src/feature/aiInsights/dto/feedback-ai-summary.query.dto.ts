import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsIn, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

import { AiFeedbackSummaryStatus } from '../enums/ai-feedback-summary-status.enum';
import { FinalAiRecommendation } from '../enums/final-ai-recommendation.enum';

const FEEDBACK_AI_SUMMARY_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'generated_at',
  'final_ai_recommendation',
] as const;

export class FeedbackAiSummaryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Filter by application UUID' })
  @IsOptional()
  @IsUUID()
  application_id?: string;

  @ApiPropertyOptional({ enum: FinalAiRecommendation })
  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(FinalAiRecommendation)
  final_ai_recommendation?: FinalAiRecommendation;

  @ApiPropertyOptional({ enum: AiFeedbackSummaryStatus })
  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(AiFeedbackSummaryStatus)
  generation_status?: AiFeedbackSummaryStatus;

  @ApiPropertyOptional({
    description: 'Filter summaries with generated_at >= this date (ISO)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  generated_from?: string;

  @ApiPropertyOptional({
    description: 'Filter summaries with generated_at <= this date (ISO)',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  generated_to?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: FEEDBACK_AI_SUMMARY_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(FEEDBACK_AI_SUMMARY_SORT_FIELDS)
  override sort_by?: (typeof FEEDBACK_AI_SUMMARY_SORT_FIELDS)[number] =
    'created_at';
}
