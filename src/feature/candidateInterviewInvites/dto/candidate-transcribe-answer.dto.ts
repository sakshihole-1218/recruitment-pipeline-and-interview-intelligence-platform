import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CandidateTranscribeAnswerDto {
  @ApiProperty({ description: 'AI interview question UUID' })
  @IsUUID()
  ai_interview_question_id: string;
}
