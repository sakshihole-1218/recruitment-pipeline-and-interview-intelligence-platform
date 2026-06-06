import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveProctoringEventDto {
  @ApiPropertyOptional({
    example: 'Reviewed by interviewer; candidate confirmed temporary network issue.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution_note?: string;
}
