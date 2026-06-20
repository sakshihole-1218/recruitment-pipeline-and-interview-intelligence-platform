import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { DecisionSource } from '../enums/decision-source.enum';
import { DecisionStatus } from '../enums/decision-status.enum';

export class CreateApplicationDecisionDto {
  @ApiProperty({ description: 'Application UUID' })
  @IsUUID()
  application_id: string;

  @ApiProperty({ enum: DecisionStatus })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(DecisionStatus)
  decision_status: DecisionStatus;

  @ApiPropertyOptional({
    description:
      'Reason for the decision. Required when decision_status is REJECTED or HOLD.',
    maxLength: 2000,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    return String(value).trim();
  })
  @IsString()
  @MaxLength(2000)
  decision_reason?: string;

  @ApiPropertyOptional({
    description: 'Additional decision notes for audit/review context',
    maxLength: 5000,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    return String(value).trim();
  })
  @IsString()
  @MaxLength(5000)
  decision_notes?: string;

  @ApiPropertyOptional({
    description:
      'Deciding user UUID. Defaults to the current authenticated user when omitted for backward compatibility.',
  })
  @IsOptional()
  @IsUUID()
  decided_by_user_id?: string;

  @ApiPropertyOptional({ description: 'AI interview session UUID' })
  @IsOptional()
  @IsUUID()
  ai_interview_session_id?: string;

  @ApiPropertyOptional({ description: 'AI interview feedback UUID' })
  @IsOptional()
  @IsUUID()
  ai_interview_feedback_id?: string;

  @ApiPropertyOptional({ enum: DecisionSource })
  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(DecisionSource)
  decision_source?: DecisionSource;
}
