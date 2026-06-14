import { ApiProperty } from '@nestjs/swagger';

export class LivekitWebhookResponseDto {
  @ApiProperty()
  processed: boolean;

  @ApiProperty()
  event_type: string;

  @ApiProperty({ nullable: true })
  room_name: string | null;

  @ApiProperty({ nullable: true })
  room_status: string | null;
}
