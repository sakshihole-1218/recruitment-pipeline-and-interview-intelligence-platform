import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelAiInterviewSessionDto {
  @ApiPropertyOptional({ description: 'Cancel reason' })
  @IsOptional()
  @IsString()
  failure_reason?: string;
}
