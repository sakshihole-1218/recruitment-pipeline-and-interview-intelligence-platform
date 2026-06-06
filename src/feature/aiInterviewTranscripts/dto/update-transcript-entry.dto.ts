import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateTranscriptEntryDto {
  @ApiPropertyOptional({ description: 'Transcript message text' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message_text?: string;

  @ApiPropertyOptional({ description: 'When the message was spoken', example: '2026-06-06T10:30:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  spoken_at?: Date;

  @ApiPropertyOptional({ description: 'Speech-to-text confidence score for future integrations', example: 0.9811 })
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
