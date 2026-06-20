import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

export class ApplicationResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ example: 'APP-2026-000001' })
  application_number: string;

  @ApiProperty({ description: 'Candidate UUID' })
  candidate_id: string;

  @ApiProperty({ description: 'Job opening UUID' })
  job_opening_id: string;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  applied_at: Date;

  @ApiProperty({ enum: ApplicationCurrentStage })
  current_stage: ApplicationCurrentStage;

  @ApiProperty({ enum: ApplicationStatus })
  application_status: ApplicationStatus;

  @ApiPropertyOptional({ example: '75.50', nullable: true })
  screening_score: string | null;

  @ApiPropertyOptional({ example: '82.25', nullable: true })
  fit_score: string | null;

  @ApiPropertyOptional({
    description: 'Assigned recruiter user UUID',
    nullable: true,
  })
  assigned_recruiter_user_id: string | null;

  @ApiPropertyOptional({
    description: 'Assigned hiring manager user UUID',
    nullable: true,
  })
  assigned_hiring_manager_user_id: string | null;

  @ApiProperty({ example: false })
  is_priority: boolean;

  @ApiPropertyOptional({ nullable: true })
  rejection_reason: string | null;

  @ApiPropertyOptional({ nullable: true })
  withdrawal_reason: string | null;

  @ApiPropertyOptional({ example: '2026-01-15T10:30:00.000Z', nullable: true })
  last_stage_changed_at: Date | null;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
