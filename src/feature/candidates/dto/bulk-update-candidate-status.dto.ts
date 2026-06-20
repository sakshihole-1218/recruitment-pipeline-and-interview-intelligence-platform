import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class BulkUpdateCandidateStatusDto {
  @ApiProperty({
    description:
      'Candidate UUIDs. Each entry is processed independently (partial success).',
    example: ['8f7f3de0-1c2b-4e88-9b26-2f1a4d7c7e33'],
  })
  @IsArray()
  @ArrayMinSize(1)
  candidate_ids: unknown[];

  @ApiProperty({ description: 'Active flag to apply', example: true })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active: boolean;
}
