import { ApiProperty } from '@nestjs/swagger';

import { AiInterviewQuestionResponseDto } from './ai-interview-question.response.dto';

export class GenerateFollowUpQuestionResponseDto {
  @ApiProperty()
  should_generate_follow_up: boolean;

  @ApiProperty({
    type: () => AiInterviewQuestionResponseDto,
    nullable: true,
  })
  follow_up_question: AiInterviewQuestionResponseDto | null;
}
