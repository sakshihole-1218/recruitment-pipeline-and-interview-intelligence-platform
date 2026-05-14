import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';

export class MoveApplicationStageDto {
  @ApiProperty({ enum: ApplicationCurrentStage })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(ApplicationCurrentStage)
  to_stage: ApplicationCurrentStage;

  @ApiPropertyOptional({ example: 'Screening completed' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  change_reason?: string;
}
