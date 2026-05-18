import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Actor user UUID' })
  decided_by_user_id: string;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  decision_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
