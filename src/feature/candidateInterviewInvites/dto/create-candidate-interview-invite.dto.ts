import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateCandidateInterviewInviteDto {
  @ApiProperty({ description: 'Interview UUID' })
  @IsUUID()
  interview_id: string;
}
