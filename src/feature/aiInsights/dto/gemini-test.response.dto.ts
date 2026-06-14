import { ApiProperty } from '@nestjs/swagger';

export class GeminiTestResponseDto {
  @ApiProperty({ example: 'gemini' })
  provider: string;

  @ApiProperty({ example: 'Hello from Gemini!' })
  response_text: string;
}
