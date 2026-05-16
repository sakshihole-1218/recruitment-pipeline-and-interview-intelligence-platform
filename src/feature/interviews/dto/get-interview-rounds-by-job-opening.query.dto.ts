import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetInterviewRoundsByJobOpeningQueryDto {
  @ApiProperty({ description: 'Job opening UUID' })
  @IsUUID()
  job_opening_id: string;
}
