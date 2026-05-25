import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class BulkAssignRecruiterDto {
  @ApiProperty({
    description: 'Application UUIDs',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  application_ids: string[];

  @ApiProperty({ description: 'Recruiter user UUID' })
  @IsUUID()
  recruiter_user_id: string;
}
