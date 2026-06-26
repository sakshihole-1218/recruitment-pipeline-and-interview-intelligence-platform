import { ApiProperty } from '@nestjs/swagger';

import { ApplicationCurrentStage } from '../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../applications/enums/application-status.enum';

export class EligibleDecisionApplicationResponseDto {
  @ApiProperty({ description: 'Application UUID' })
  id: string;

  @ApiProperty({ example: 'APP-2026-000001' })
  application_number: string;

  @ApiProperty({ description: 'Candidate UUID' })
  candidate_id: string;

  @ApiProperty({ description: 'Job opening UUID' })
  job_opening_id: string;

  @ApiProperty({ enum: ApplicationCurrentStage })
  current_stage: ApplicationCurrentStage;

  @ApiProperty({ enum: ApplicationStatus })
  application_status: ApplicationStatus;

  @ApiProperty({ nullable: true, description: 'Assigned hiring manager user UUID' })
  assigned_hiring_manager_user_id: string | null;

  @ApiProperty({ example: '2026-06-26T10:30:00.000Z' })
  updated_at: Date;
}
