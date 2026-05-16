import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelInterviewDto {
  @ApiProperty({ example: 'Interviewer unavailable' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  cancel_reason: string;
}
