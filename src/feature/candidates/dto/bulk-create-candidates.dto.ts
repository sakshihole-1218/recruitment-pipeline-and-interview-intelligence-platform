import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray } from 'class-validator';

import { CreateCandidateDto } from './create-candidate.dto';

export class BulkCreateCandidatesDto {
  @ApiProperty({
    description: 'Candidates to create. Each entry is validated independently (partial success).',
    type: [CreateCandidateDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  candidates: Record<string, unknown>[];
}
