import { ApiProperty } from '@nestjs/swagger';

import { RiskLevel } from '../enums/risk-level.enum';

export class ProctoringRiskSummaryResponseDto {
  @ApiProperty()
  ai_interview_session_id: string;

  @ApiProperty()
  total_events: number;

  @ApiProperty()
  low_count: number;

  @ApiProperty()
  medium_count: number;

  @ApiProperty()
  high_count: number;

  @ApiProperty()
  critical_count: number;

  @ApiProperty()
  risk_score: number;

  @ApiProperty({ enum: RiskLevel })
  risk_level: RiskLevel;

  @ApiProperty()
  summary: string;
}
