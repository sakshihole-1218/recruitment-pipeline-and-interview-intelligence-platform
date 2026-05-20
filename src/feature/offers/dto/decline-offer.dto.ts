import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class DeclineOfferDto {
  @ApiProperty({ example: 'Accepted another offer' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  decline_reason: string;
}
