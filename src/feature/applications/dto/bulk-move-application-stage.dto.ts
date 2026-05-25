import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';

export class BulkMoveApplicationStageDto {
  @ApiProperty({
    description: 'Application UUIDs',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  application_ids: string[];

  @ApiProperty({
    description: 'Target application stage',
    enum: ApplicationCurrentStage,
  })
  @IsEnum(ApplicationCurrentStage)
  target_stage: ApplicationCurrentStage;

  @ApiProperty({ example: 'Moving to interview after shortlist review' })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  change_reason: string;
}
