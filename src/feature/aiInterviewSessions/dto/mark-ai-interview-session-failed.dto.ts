import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MarkAiInterviewSessionFailedDto {
  @ApiProperty({ description: 'Failure reason' })
  @IsString()
  failure_reason: string;
}
