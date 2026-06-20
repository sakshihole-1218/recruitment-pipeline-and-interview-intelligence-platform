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

import { DifficultyLevel } from '../enums/difficulty-level.enum';
import { GeneratedFrom } from '../enums/generated-from.enum';
import { QuestionType } from '../enums/question-type.enum';

const AI_INTERVIEW_QUESTION_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'sequence_number',
  'asked_at',
  'answered_at',
  'question_type',
  'difficulty_level',
  'generated_from',
  'topic',
] as const;

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

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

  return undefined;
}

export class AiInterviewQuestionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and sort_by must be created_at.',
    example: '2026-06-06T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Search by question text or topic' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'AI interview session UUID' })
  @IsOptional()
  @IsUUID()
  ai_interview_session_id?: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  question_type?: QuestionType;

  @ApiPropertyOptional({ enum: DifficultyLevel })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty_level?: DifficultyLevel;

  @ApiPropertyOptional({ enum: GeneratedFrom })
  @IsOptional()
  @IsEnum(GeneratedFrom)
  generated_from?: GeneratedFrom;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  is_follow_up?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  is_answered?: boolean;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: AI_INTERVIEW_QUESTION_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(AI_INTERVIEW_QUESTION_SORT_FIELDS)
  override sort_by?: (typeof AI_INTERVIEW_QUESTION_SORT_FIELDS)[number] =
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
