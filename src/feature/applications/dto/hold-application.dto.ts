import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HoldApplicationDto {
  @ApiPropertyOptional({ example: 'Waiting for headcount approval' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  change_reason?: string;
}
