import { ApiProperty } from '@nestjs/swagger';

import { LivekitRoomStatus } from '../enums/livekit-room-status.enum';

export class LivekitRoomSessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ai_interview_session_id: string;

  @ApiProperty()
  interview_id: string;

  @ApiProperty()
  application_id: string;

  @ApiProperty()
  candidate_id: string;

  @ApiProperty()
  room_name: string;

  @ApiProperty({ enum: LivekitRoomStatus })
  room_status: LivekitRoomStatus;

  @ApiProperty({ nullable: true })
  candidate_identity: string | null;

  @ApiProperty({ nullable: true })
  ai_agent_identity: string | null;

  @ApiProperty({ nullable: true })
  room_started_at: Date | null;

  @ApiProperty({ nullable: true })
  room_ended_at: Date | null;

  @ApiProperty({ nullable: true })
  last_webhook_event_at: Date | null;

  @ApiProperty({ type: 'object', nullable: true, additionalProperties: true })
  metadata: Record<string, unknown> | null;

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
