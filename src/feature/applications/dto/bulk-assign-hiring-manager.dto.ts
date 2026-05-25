import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class BulkAssignHiringManagerDto {
  @ApiProperty({
    description: 'Application UUIDs',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  application_ids: string[];

  @ApiProperty({ description: 'Hiring manager user UUID' })
  @IsUUID()
  hiring_manager_user_id: string;
}
