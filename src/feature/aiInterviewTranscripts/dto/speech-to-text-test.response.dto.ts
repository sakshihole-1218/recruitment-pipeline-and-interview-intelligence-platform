import { ApiProperty } from '@nestjs/swagger';

export class SpeechToTextTestResponseDto {
  @ApiProperty({
    example:
      'Thanks for the opportunity. My approach would be to optimize the API first.',
  })
  transcript: string;

  @ApiProperty({ example: 'groq' })
  provider: string;

  @ApiProperty({ example: 'whisper-large-v3-turbo', nullable: true })
  model: string | null;
}
