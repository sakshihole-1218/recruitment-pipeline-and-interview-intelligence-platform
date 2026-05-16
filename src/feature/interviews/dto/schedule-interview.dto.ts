import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { InterviewMode } from '../enums/interview-mode.enum';
import { InterviewPanelMemberInputDto } from './assign-interview-panel-members.dto';

export class ScheduleInterviewDto {
  @ApiProperty({ description: 'Application UUID' })
  @IsUUID()
  application_id: string;

  @ApiProperty({ description: 'Interview round UUID' })
  @IsUUID()
  interview_round_id: string;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  @IsISO8601()
  scheduled_start_at: string;

  @ApiProperty({ example: '2026-01-15T11:30:00.000Z' })
  @IsISO8601()
  scheduled_end_at: string;

  @ApiProperty({ enum: InterviewMode })
  @IsEnum(InterviewMode)
  interview_mode: InterviewMode;

  @ApiPropertyOptional({ example: 'https://meet.google.com/xxx-yyyy-zzz' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  meeting_link?: string;

  @ApiPropertyOptional({ example: 'Office - Meeting Room A, 3rd floor' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  location_details?: string;

  @ApiPropertyOptional({
    type: [InterviewPanelMemberInputDto],
    description: 'Optional panel members to assign while scheduling',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InterviewPanelMemberInputDto)
  members?: InterviewPanelMemberInputDto[];
}
