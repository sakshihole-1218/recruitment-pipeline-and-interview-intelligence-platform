import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { InterviewRecommendation } from '../enums/interview-recommendation.enum';

export class InterviewFeedbackResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Interview UUID' })
  interview_id: string;

  @ApiProperty({ description: 'Interviewer user UUID' })
  interviewer_user_id: string;

  @ApiProperty({ example: 8 })
  technical_score: number;

  @ApiProperty({ example: 7 })
  communication_score: number;

  @ApiProperty({ example: 8 })
  problem_solving_score: number;

  @ApiProperty({ example: 7 })
  culture_fit_score: number;

  @ApiProperty({ example: '7.50' })
  overall_score: string;

  @ApiPropertyOptional({ nullable: true })
  strengths: string | null;

  @ApiPropertyOptional({ nullable: true })
  concerns: string | null;

  @ApiPropertyOptional({ nullable: true })
  detailed_feedback: string | null;

  @ApiProperty({ enum: InterviewRecommendation })
  recommendation: InterviewRecommendation;

  @ApiProperty({ example: '2026-01-15T12:30:00.000Z' })
  submitted_at: Date;

  @ApiProperty({ example: '2026-01-15T12:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T12:30:00.000Z' })
  updated_at: Date;
}
