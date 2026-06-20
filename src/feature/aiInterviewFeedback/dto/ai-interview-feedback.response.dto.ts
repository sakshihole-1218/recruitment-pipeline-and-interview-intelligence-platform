import { ApiProperty } from '@nestjs/swagger';

import { AiInterviewFeedbackStatus } from '../enums/ai-interview-feedback-status.enum';
import { AiInterviewRecommendation } from '../enums/ai-interview-recommendation.enum';

export class AiInterviewFeedbackResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ai_interview_session_id: string;

  @ApiProperty()
  application_id: string;

  @ApiProperty()
  candidate_id: string;

  @ApiProperty({ nullable: true })
  resume_analysis_id: string | null;

  @ApiProperty({ nullable: true })
  technical_score: number | null;

  @ApiProperty({ nullable: true })
  communication_score: number | null;

  @ApiProperty({ nullable: true })
  problem_solving_score: number | null;

  @ApiProperty({ nullable: true })
  project_understanding_score: number | null;

  @ApiProperty({ nullable: true })
  answer_relevance_score: number | null;

  @ApiProperty({ nullable: true })
  confidence_score: number | null;

  @ApiProperty({ nullable: true })
  overall_score: number | null;

  @ApiProperty({ nullable: true })
  technical_summary: string | null;

  @ApiProperty({ nullable: true })
  communication_summary: string | null;

  @ApiProperty({ nullable: true })
  problem_solving_summary: string | null;

  @ApiProperty({ nullable: true })
  project_understanding_summary: string | null;

  @ApiProperty({ nullable: true })
  strengths: string | null;

  @ApiProperty({ nullable: true })
  concerns: string | null;

  @ApiProperty({ nullable: true })
  improvement_areas: string | null;

  @ApiProperty({ enum: AiInterviewRecommendation, nullable: true })
  ai_recommendation: AiInterviewRecommendation | null;

  @ApiProperty({ enum: AiInterviewFeedbackStatus })
  feedback_status: AiInterviewFeedbackStatus;

  @ApiProperty({ nullable: true })
  generated_at: Date | null;

  @ApiProperty({ nullable: true })
  failure_reason: string | null;

  @ApiProperty({ type: Object, nullable: true })
  raw_ai_payload: Record<string, unknown> | null;

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
