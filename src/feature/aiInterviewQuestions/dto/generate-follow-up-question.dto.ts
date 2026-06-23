import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class GenerateFollowUpQuestionDto {
  @ApiProperty({ description: 'AI interview session UUID' })
  @IsUUID()
  ai_interview_session_id: string;

  @ApiProperty({ description: 'AI interview question UUID' })
  @IsUUID()
  ai_interview_question_id: string;

  @ApiProperty({ description: 'Candidate answer text' })
  @IsString()
  candidate_answer: string;
}
