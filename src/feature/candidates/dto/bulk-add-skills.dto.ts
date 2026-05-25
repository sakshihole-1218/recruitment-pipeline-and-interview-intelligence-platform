import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray } from 'class-validator';

export class BulkAddSkillsDto {
  @ApiProperty({
    description: 'Candidate UUIDs. Each entry is processed independently (partial success).',
    example: ['8f7f3de0-1c2b-4e88-9b26-2f1a4d7c7e33'],
  })
  @IsArray()
  @ArrayMinSize(1)
  candidate_ids: unknown[];

  @ApiProperty({
    description: 'Skill UUIDs to add to each candidate. Invalid skills are reported and skipped.',
    example: ['b2a0dc6f-6c34-4a55-9eaf-31557e6b6c2a'],
  })
  @IsArray()
  @ArrayMinSize(1)
  skill_ids: unknown[];
}
