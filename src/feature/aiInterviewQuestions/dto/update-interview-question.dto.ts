import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateInterviewQuestionDto {
  @ApiPropertyOptional({ description: 'Updated question text' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  question_text?: string;

  @ApiPropertyOptional({ example: '2026-06-06T10:30:00.000Z' })
  @IsOptional()
  @IsISO8601()
  asked_at?: string;

  @ApiPropertyOptional({ example: '2026-06-06T10:31:00.000Z' })
  @IsOptional()
  @IsISO8601()
  answered_at?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_answered?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'Expected answer keywords stored as jsonb array',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  expected_answer_keywords?: string[];
}
