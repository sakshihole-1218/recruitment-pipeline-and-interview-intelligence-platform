import { ApiProperty } from '@nestjs/swagger';

export class DeleteAiInterviewSessionResponseDto {
  @ApiProperty({ description: 'Deleted session UUID' })
  id: string;
}
