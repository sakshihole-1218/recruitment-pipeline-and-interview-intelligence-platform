import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

import { TranscriptSpeakerType } from '../enums/transcript-speaker-type.enum';

const AI_INTERVIEW_TRANSCRIPT_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'sequence_number',
  'spoken_at',
  'speaker_type',
] as const;

export class TranscriptQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and sort_by must be created_at.',
    example: '2026-06-06T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'AI interview session UUID' })
  @IsOptional()
  @IsUUID()
  ai_interview_session_id?: string;

  @ApiPropertyOptional({ description: 'AI interview question UUID' })
  @IsOptional()
  @IsUUID()
  ai_interview_question_id?: string;

  @ApiPropertyOptional({ enum: TranscriptSpeakerType })
  @IsOptional()
  @IsEnum(TranscriptSpeakerType)
  speaker_type?: TranscriptSpeakerType;

  @ApiPropertyOptional({ description: 'Filter transcripts spoken from this ISO timestamp', example: '2026-06-06T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  spoken_from?: string;

  @ApiPropertyOptional({ description: 'Filter transcripts spoken until this ISO timestamp', example: '2026-06-06T11:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  spoken_to?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: AI_INTERVIEW_TRANSCRIPT_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(AI_INTERVIEW_TRANSCRIPT_SORT_FIELDS)
  override sort_by?: (typeof AI_INTERVIEW_TRANSCRIPT_SORT_FIELDS)[number] = 'created_at';

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
