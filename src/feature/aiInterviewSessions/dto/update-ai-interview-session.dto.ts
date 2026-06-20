import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { AiInterviewSessionStatus } from '../enums/ai-interview-session-status.enum';
import { QuestionGenerationStatus } from '../enums/question-generation-status.enum';
import { FeedbackGenerationStatus } from '../enums/feedback-generation-status.enum';

export class UpdateAiInterviewSessionDto {
  @ApiPropertyOptional({ enum: AiInterviewSessionStatus })
  @IsOptional()
  @IsEnum(AiInterviewSessionStatus)
  session_status?: AiInterviewSessionStatus;

  @ApiPropertyOptional({ description: 'Future LiveKit room name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  livekit_room_name?: string;

  @ApiPropertyOptional({ enum: QuestionGenerationStatus })
  @IsOptional()
  @IsEnum(QuestionGenerationStatus)
  question_generation_status?: QuestionGenerationStatus;

  @ApiPropertyOptional({ enum: FeedbackGenerationStatus })
  @IsOptional()
  @IsEnum(FeedbackGenerationStatus)
  feedback_generation_status?: FeedbackGenerationStatus;

  @ApiPropertyOptional({ description: 'Failure/cancel reason' })
  @IsOptional()
  @IsString()
  failure_reason?: string;
}
