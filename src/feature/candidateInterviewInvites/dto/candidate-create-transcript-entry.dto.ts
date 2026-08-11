import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { TranscriptSpeakerType } from '../../aiInterviewTranscripts/enums/transcript-speaker-type.enum';

export class CandidateCreateTranscriptEntryDto {
  @ApiPropertyOptional({ description: 'Linked AI interview question UUID' })
  @IsOptional()
  @IsUUID()
  ai_interview_question_id?: string;

  @ApiProperty({ enum: TranscriptSpeakerType })
  @IsEnum(TranscriptSpeakerType)
  speaker_type: TranscriptSpeakerType;

  @ApiProperty({ description: 'Transcript message text' })
  @IsString()
  @IsNotEmpty()
  message_text: string;

  @ApiPropertyOptional({
    description: 'Sequence number within a session',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence_number?: number;

  @ApiPropertyOptional({
    description: 'When the message was spoken',
    example: '2026-06-06T10:30:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  spoken_at?: Date;

  @ApiPropertyOptional({
    description: 'Speech-to-text confidence score for future integrations',
    example: 0.9842,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  speech_to_text_confidence?: number;

  @ApiPropertyOptional({
    description: 'Raw provider payload for future LiveKit/STT ingestion',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  raw_payload?: Record<string, unknown>;
}
