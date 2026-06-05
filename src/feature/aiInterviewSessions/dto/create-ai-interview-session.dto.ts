import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateAiInterviewSessionDto {
  @ApiProperty({ description: 'Scheduled interview UUID' })
  @IsUUID()
  interview_id: string;

  @ApiPropertyOptional({ description: 'Resume analysis UUID (optional)' })
  @IsOptional()
  @IsUUID()
  resume_analysis_id?: string;
}
