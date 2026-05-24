import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GenerateFeedbackAiSummaryDto {
  @ApiProperty({ description: 'Application UUID' })
  @IsUUID()
  application_id: string;
}
