import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectApplicationDto {
  @ApiProperty({ example: 'Not a fit for current requirements' })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  rejection_reason: string;
}
