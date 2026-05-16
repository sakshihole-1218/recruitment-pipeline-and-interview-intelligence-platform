import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class CompleteInterviewDto {
  @ApiPropertyOptional({
    description: 'If omitted, the server sets it to current time',
    example: '2026-01-15T11:35:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  completed_at?: string;
}
