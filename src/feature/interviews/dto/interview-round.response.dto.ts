import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { InterviewRoundType } from '../enums/interview-round-type.enum';

export class InterviewRoundResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Job opening UUID' })
  job_opening_id: string;

  @ApiProperty({ example: 'Technical Round 1' })
  round_name: string;

  @ApiProperty({ enum: InterviewRoundType })
  round_type: InterviewRoundType;

  @ApiProperty({ example: 1 })
  sequence_number: number;

  @ApiProperty({ example: true })
  is_mandatory: boolean;

  @ApiPropertyOptional({ example: 10, nullable: true })
  max_score: number | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
