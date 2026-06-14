import { ApiProperty } from '@nestjs/swagger';

import { LivekitParticipantType } from '../enums/livekit-participant-type.enum';

export class LivekitAccessTokenResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  room_name: string;

  @ApiProperty()
  identity: string;

  @ApiProperty()
  display_name: string;

  @ApiProperty({ enum: LivekitParticipantType })
  participant_type: LivekitParticipantType;

  @ApiProperty()
  livekit_url: string;
}
