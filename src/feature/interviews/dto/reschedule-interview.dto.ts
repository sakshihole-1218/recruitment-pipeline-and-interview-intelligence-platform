import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RescheduleInterviewDto {
  @ApiProperty({ example: '2026-01-16T10:30:00.000Z' })
  @IsISO8601()
  scheduled_start_at: string;

  @ApiProperty({ example: '2026-01-16T11:30:00.000Z' })
  @IsISO8601()
  scheduled_end_at: string;

  @ApiProperty({ example: 'Candidate requested a different time slot' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reschedule_reason: string;

  @ApiPropertyOptional({ example: 'https://meet.google.com/new-link' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  meeting_link?: string;

  @ApiPropertyOptional({ example: 'Office - Meeting Room B' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  location_details?: string;
}
