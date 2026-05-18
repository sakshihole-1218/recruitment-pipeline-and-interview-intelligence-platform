import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { DecisionStatus } from '../enums/decision-status.enum';

export class CreateApplicationDecisionDto {
  @ApiProperty({ description: 'Application UUID' })
  @IsUUID()
  application_id: string;

  @ApiProperty({ enum: DecisionStatus })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
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
}
