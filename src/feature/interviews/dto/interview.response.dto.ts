import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { InterviewMode } from '../enums/interview-mode.enum';
import { InterviewStatus } from '../enums/interview-status.enum';
import { InterviewPanelMemberResponseDto } from './interview-panel-member.response.dto';

export class InterviewResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Application UUID' })
  application_id: string;

  @ApiProperty({ description: 'Interview round UUID' })
  interview_round_id: string;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  scheduled_start_at: Date;

  @ApiProperty({ example: '2026-01-15T11:30:00.000Z' })
  scheduled_end_at: Date;

  @ApiProperty({ enum: InterviewMode })
  interview_mode: InterviewMode;

  @ApiProperty({ default: false })
  is_ai_interview: boolean;

  @ApiPropertyOptional({ nullable: true })
  meeting_link: string | null;

  @ApiPropertyOptional({ nullable: true })
  location_details: string | null;

  @ApiProperty({ enum: InterviewStatus })
  interview_status: InterviewStatus;

  @ApiProperty({ description: 'Scheduled by user UUID' })
  scheduled_by_user_id: string;

  @ApiPropertyOptional({ nullable: true })
  rescheduled_from_interview_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  reschedule_reason: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancel_reason: string | null;

  @ApiPropertyOptional({ nullable: true })
  completed_at: Date | null;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: [InterviewPanelMemberResponseDto] })
  panel_members?: InterviewPanelMemberResponseDto[];
}
