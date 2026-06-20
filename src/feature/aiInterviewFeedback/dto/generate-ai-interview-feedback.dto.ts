import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GenerateAiInterviewFeedbackDto {
  @ApiProperty({ description: 'AI interview session UUID' })
  @IsUUID()
  ai_interview_session_id: string;
}
