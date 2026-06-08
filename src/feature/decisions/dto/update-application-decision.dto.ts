import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { DecisionSource } from '../enums/decision-source.enum';
import { DecisionStatus } from '../enums/decision-status.enum';

export class UpdateApplicationDecisionDto {
  @ApiPropertyOptional({ enum: DecisionStatus })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(DecisionStatus)
  decision_status?: DecisionStatus;

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

  @ApiPropertyOptional({ enum: DecisionSource })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(DecisionSource)
  decision_source?: DecisionSource;
}
