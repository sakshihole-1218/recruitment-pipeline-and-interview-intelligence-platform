import { ApiProperty } from '@nestjs/swagger';

import { InterviewPanelRole } from '../enums/interview-panel-role.enum';

export class InterviewPanelMemberResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Interview UUID' })
  interview_id: string;

  @ApiProperty({ description: 'User UUID' })
  user_id: string;

  @ApiProperty({ enum: InterviewPanelRole })
  role_in_panel: InterviewPanelRole;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
