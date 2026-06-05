import { ApiProperty } from '@nestjs/swagger';

import { AiInterviewSessionStatus } from '../enums/ai-interview-session-status.enum';
import { QuestionGenerationStatus } from '../enums/question-generation-status.enum';
import { FeedbackGenerationStatus } from '../enums/feedback-generation-status.enum';

export class AiInterviewSessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  interview_id: string;

  @ApiProperty()
  application_id: string;

  @ApiProperty()
  candidate_id: string;

  @ApiProperty({ nullable: true })
  resume_analysis_id: string | null;

  @ApiProperty()
  session_code: string;

  @ApiProperty({ enum: AiInterviewSessionStatus })
  session_status: AiInterviewSessionStatus;

  @ApiProperty({ nullable: true })
  livekit_room_name: string | null;

  @ApiProperty({ enum: QuestionGenerationStatus })
  question_generation_status: QuestionGenerationStatus;

  @ApiProperty({ enum: FeedbackGenerationStatus })
  feedback_generation_status: FeedbackGenerationStatus;

  @ApiProperty({ nullable: true })
  started_at: Date | null;

  @ApiProperty({ nullable: true })
  ended_at: Date | null;

  @ApiProperty({ nullable: true })
  duration_seconds: number | null;

  @ApiProperty({ nullable: true })
  failure_reason: string | null;

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
