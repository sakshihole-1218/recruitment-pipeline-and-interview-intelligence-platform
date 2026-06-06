import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { ProctoringEventType } from '../enums/proctoring-event-type.enum';
import { ProctoringSeverity } from '../enums/proctoring-severity.enum';

export class CreateProctoringEventItemDto {
  @ApiProperty({ enum: ProctoringEventType })
  @IsEnum(ProctoringEventType)
  event_type: ProctoringEventType;

  @ApiProperty({ enum: ProctoringSeverity })
  @IsEnum(ProctoringSeverity)
  severity: ProctoringSeverity;

  @ApiProperty({ example: 'Candidate switched tabs during coding question.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  event_message: string;

  @ApiPropertyOptional({ type: Object, nullable: true })
  @IsOptional()
  @IsObject()
  event_metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '2026-06-06T10:30:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  occurred_at?: Date;

  @ApiPropertyOptional({ example: 12, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration_seconds?: number;
}
