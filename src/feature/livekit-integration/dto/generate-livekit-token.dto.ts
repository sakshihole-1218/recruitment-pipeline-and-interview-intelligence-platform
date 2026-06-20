import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { LivekitParticipantType } from '../enums/livekit-participant-type.enum';

export class GenerateLiveKitTokenDto {
  @ApiProperty({ description: 'AI interview session UUID' })
  @IsUUID()
  ai_interview_session_id: string;

  @ApiProperty({ enum: LivekitParticipantType })
  @IsEnum(LivekitParticipantType)
  participant_type: LivekitParticipantType;

  @ApiPropertyOptional({
    description: 'Optional custom identity for reviewer/admin flows',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  identity?: string;

  @ApiPropertyOptional({ description: 'Participant display name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  display_name?: string;
}
