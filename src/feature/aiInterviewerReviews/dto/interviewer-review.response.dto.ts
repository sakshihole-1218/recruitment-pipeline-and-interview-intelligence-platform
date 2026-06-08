import { ApiProperty } from '@nestjs/swagger';

import { InterviewerRecommendation } from '../enums/interviewer-recommendation.enum';
import { InterviewerReviewStatus } from '../enums/interviewer-review-status.enum';

export class InterviewerReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ai_interview_session_id: string;

  @ApiProperty({ nullable: true })
  ai_interview_feedback_id: string | null;

  @ApiProperty()
  application_id: string;

  @ApiProperty()
  candidate_id: string;

  @ApiProperty()
  reviewer_user_id: string;

  @ApiProperty({ nullable: true })
  technical_score: number | null;

  @ApiProperty({ nullable: true })
  communication_score: number | null;

  @ApiProperty({ nullable: true })
  problem_solving_score: number | null;

  @ApiProperty({ nullable: true })
  culture_fit_score: number | null;

  @ApiProperty({ nullable: true })
  overall_score: number | null;

  @ApiProperty({ nullable: true })
  strengths: string | null;

  @ApiProperty({ nullable: true })
  concerns: string | null;

  @ApiProperty({ nullable: true })
  detailed_review: string | null;

  @ApiProperty({ enum: InterviewerRecommendation, nullable: true })
  interviewer_recommendation: InterviewerRecommendation | null;

  @ApiProperty({ enum: InterviewerReviewStatus })
  review_status: InterviewerReviewStatus;

  @ApiProperty({ nullable: true })
  reviewed_at: Date | null;

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
