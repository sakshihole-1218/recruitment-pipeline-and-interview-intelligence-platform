import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class WithdrawApplicationDto {
  @ApiProperty({ example: 'Candidate accepted another offer' })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  withdrawal_reason: string;
}
