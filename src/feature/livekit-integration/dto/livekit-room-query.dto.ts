import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LivekitRoomStatus } from '../enums/livekit-room-status.enum';

const LIVEKIT_ROOM_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'room_started_at',
  'room_ended_at',
  'last_webhook_event_at',
  'room_status',
] as const;

export class LiveKitRoomQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and sort_by must be created_at.',
    example: '2026-06-09T12:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'AI interview session UUID' })
  @IsOptional()
  @IsUUID()
  ai_interview_session_id?: string;

  @ApiPropertyOptional({ description: 'Interview UUID' })
  @IsOptional()
  @IsUUID()
  interview_id?: string;

  @ApiPropertyOptional({ description: 'Application UUID' })
  @IsOptional()
  @IsUUID()
  application_id?: string;

  @ApiPropertyOptional({ description: 'Candidate UUID' })
  @IsOptional()
  @IsUUID()
  candidate_id?: string;

  @ApiPropertyOptional({ enum: LivekitRoomStatus })
  @IsOptional()
  @IsEnum(LivekitRoomStatus)
  room_status?: LivekitRoomStatus;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: LIVEKIT_ROOM_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(LIVEKIT_ROOM_SORT_FIELDS)
  override sort_by?: (typeof LIVEKIT_ROOM_SORT_FIELDS)[number] = 'created_at';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(['asc', 'desc'])
  override sort_order?: 'asc' | 'desc' = 'desc';
}
