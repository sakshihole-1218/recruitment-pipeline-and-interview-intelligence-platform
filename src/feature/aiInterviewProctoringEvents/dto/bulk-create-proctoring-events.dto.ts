import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

import { CreateProctoringEventItemDto } from './create-proctoring-event-item.dto';

export class BulkCreateProctoringEventsDto {
  @ApiProperty({ description: 'AI interview session UUID' })
  @IsUUID()
  ai_interview_session_id: string;

  @ApiProperty({ type: [CreateProctoringEventItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateProctoringEventItemDto)
  events: CreateProctoringEventItemDto[];
}
