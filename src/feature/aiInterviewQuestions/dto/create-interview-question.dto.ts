import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { DifficultyLevel } from '../enums/difficulty-level.enum';
import { GeneratedFrom } from '../enums/generated-from.enum';
import { QuestionSource } from '../enums/question-source.enum';
import { QuestionStatus } from '../enums/question-status.enum';
import { QuestionType } from '../enums/question-type.enum';

export class CreateInterviewQuestionDto {
  @ApiProperty({ description: 'AI interview session UUID' })
  @IsUUID()
  ai_interview_session_id: string;

  @ApiProperty({ description: 'Interview question text' })
  @IsString()
  @MaxLength(2000)
  question_text: string;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  question_type: QuestionType;

  @ApiProperty({ description: 'Question topic', example: 'NestJS Modules' })
  @IsString()
  @MaxLength(150)
  topic: string;

  @ApiProperty({ enum: DifficultyLevel })
  @IsEnum(DifficultyLevel)
  difficulty_level: DifficultyLevel;

  @ApiProperty({ description: 'Question order within the session', example: 1 })
  @IsInt()
  @Min(1)
  sequence_number: number;

  @ApiPropertyOptional({
    description: 'Parent question UUID for follow-up questions',
  })
  @IsOptional()
  @IsUUID()
  parent_question_id?: string;

  @ApiProperty({ enum: GeneratedFrom })
  @IsEnum(GeneratedFrom)
  generated_from: GeneratedFrom;

  @ApiPropertyOptional({ enum: QuestionSource, default: QuestionSource.SYSTEM })
  @IsOptional()
  @IsEnum(QuestionSource)
  question_source?: QuestionSource;

  @ApiPropertyOptional({
    enum: QuestionStatus,
    default: QuestionStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(QuestionStatus)
  question_status?: QuestionStatus;

  @ApiPropertyOptional({
    type: [String],
    description: 'Expected answer keywords stored as jsonb array',
    example: ['dependency injection', 'providers', 'module metadata'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  expected_answer_keywords?: string[];
}
