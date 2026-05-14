import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';

export class ApplicationStageHistoryResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Application UUID' })
  application_id: string;

  @ApiPropertyOptional({ enum: ApplicationCurrentStage, nullable: true })
  from_stage: ApplicationCurrentStage | null;

  @ApiProperty({ enum: ApplicationCurrentStage })
  to_stage: ApplicationCurrentStage;

  @ApiProperty({ description: 'Actor user UUID' })
  changed_by_user_id: string;

  @ApiPropertyOptional({ nullable: true })
  change_reason: string | null;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  changed_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
