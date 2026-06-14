import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class EndLiveKitRoomDto {
  @ApiProperty({ description: 'AI interview session UUID' })
  @IsUUID()
  ai_interview_session_id: string;

  @ApiPropertyOptional({ description: 'Optional reason for ending the room' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
