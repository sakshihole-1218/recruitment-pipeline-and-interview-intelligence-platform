import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class BulkCancelInterviewsDto {
  @ApiProperty({ type: [String], description: 'Interview UUIDs to cancel' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  interview_ids: string[];

  @ApiProperty({ example: 'Interviewer unavailable' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  cancel_reason: string;
}
