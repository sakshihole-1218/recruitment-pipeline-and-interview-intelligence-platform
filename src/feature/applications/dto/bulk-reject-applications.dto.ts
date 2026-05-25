import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class BulkRejectApplicationsDto {
  @ApiProperty({
    description: 'Application UUIDs',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  application_ids: string[];

  @ApiProperty({ example: 'Not a fit for current requirements' })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  rejection_reason: string;
}
