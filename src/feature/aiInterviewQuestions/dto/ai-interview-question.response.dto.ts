import { ApiProperty } from '@nestjs/swagger';

import { DifficultyLevel } from '../enums/difficulty-level.enum';
import { GeneratedFrom } from '../enums/generated-from.enum';
import { QuestionSource } from '../enums/question-source.enum';
import { QuestionStatus } from '../enums/question-status.enum';
import { QuestionType } from '../enums/question-type.enum';

export class AiInterviewQuestionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ai_interview_session_id: string;

  @ApiProperty({ nullable: true })
  parent_question_id: string | null;

  @ApiProperty()
  question_text: string;

  @ApiProperty({ enum: QuestionType })
  question_type: QuestionType;

  @ApiProperty()
  topic: string;

  @ApiProperty({ enum: DifficultyLevel })
  difficulty_level: DifficultyLevel;

  @ApiProperty()
  sequence_number: number;

  @ApiProperty()
  is_follow_up: boolean;

  @ApiProperty({ enum: QuestionSource })
  question_source: QuestionSource;

  @ApiProperty({ enum: GeneratedFrom })
  generated_from: GeneratedFrom;

  @ApiProperty({ enum: QuestionStatus })
  question_status: QuestionStatus;

  @ApiProperty({
    type: [String],
    nullable: true,
    example: ['dependency injection', 'providers', 'module imports'],
  })
  expected_answer_keywords: string[] | null;

  @ApiProperty({ nullable: true })
  follow_up_reasoning: string | null;

  @ApiProperty({ nullable: true })
  asked_at: Date | null;

  @ApiProperty({ nullable: true })
  answered_at: Date | null;

  @ApiProperty()
  is_answered: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ nullable: true })
  deleted_at: Date | null;

  @ApiProperty({ nullable: true })
  created_by_user_id: string | null;

  @ApiProperty({ nullable: true })
  updated_by_user_id: string | null;

  @ApiProperty({ nullable: true })
  deleted_by_user_id: string | null;
}
