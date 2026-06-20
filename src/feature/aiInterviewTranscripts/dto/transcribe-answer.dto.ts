import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TranscribeAnswerDto {
  @ApiProperty({ description: 'AI interview session UUID' })
  @IsUUID()
  ai_interview_session_id: string;

  @ApiProperty({ description: 'AI interview question UUID' })
  @IsUUID()
  ai_interview_question_id: string;
}
