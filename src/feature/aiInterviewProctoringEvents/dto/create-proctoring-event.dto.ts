import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

import { CreateProctoringEventItemDto } from './create-proctoring-event-item.dto';

export class CreateProctoringEventDto extends CreateProctoringEventItemDto {
  @ApiProperty({ description: 'AI interview session UUID' })
  @IsUUID()
  ai_interview_session_id: string;
}
