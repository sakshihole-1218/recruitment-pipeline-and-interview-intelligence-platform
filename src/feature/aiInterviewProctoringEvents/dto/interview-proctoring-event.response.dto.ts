import { ApiProperty } from '@nestjs/swagger';

import { ProctoringEventType } from '../enums/proctoring-event-type.enum';
import { ProctoringSeverity } from '../enums/proctoring-severity.enum';

export class InterviewProctoringEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ai_interview_session_id: string;

  @ApiProperty()
  application_id: string;

  @ApiProperty()
  candidate_id: string;

  @ApiProperty({ enum: ProctoringEventType })
  event_type: ProctoringEventType;

  @ApiProperty({ enum: ProctoringSeverity })
  severity: ProctoringSeverity;

  @ApiProperty()
  event_message: string;

  @ApiProperty({ type: Object, nullable: true })
  event_metadata: Record<string, unknown> | null;

  @ApiProperty()
  occurred_at: Date;

  @ApiProperty({ nullable: true })
  duration_seconds: number | null;

  @ApiProperty()
  is_resolved: boolean;

  @ApiProperty({ nullable: true })
  resolved_at: Date | null;

  @ApiProperty({ nullable: true })
  resolved_by_user_id: string | null;

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
