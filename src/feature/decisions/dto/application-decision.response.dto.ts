import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { DecisionSource } from '../enums/decision-source.enum';
import { DecisionStatus } from '../enums/decision-status.enum';

export class ApplicationDecisionResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Application UUID' })
  application_id: string;

  @ApiProperty({ enum: DecisionStatus })
  decision_status: DecisionStatus;

  @ApiPropertyOptional({ nullable: true })
  decision_reason: string | null;

  @ApiPropertyOptional({ nullable: true })
  decision_notes: string | null;

  @ApiProperty({ description: 'Actor user UUID' })
  decided_by_user_id: string;

  @ApiPropertyOptional({ nullable: true })
  ai_interview_session_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  ai_interview_feedback_id: string | null;

  @ApiPropertyOptional({ enum: DecisionSource, nullable: true })
  decision_source: DecisionSource | null;

  @ApiPropertyOptional({ nullable: true, example: '84.50' })
  final_score: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  ai_recommendation_snapshot: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  interviewer_recommendation_snapshot: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  proctoring_risk_snapshot: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  decision_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
