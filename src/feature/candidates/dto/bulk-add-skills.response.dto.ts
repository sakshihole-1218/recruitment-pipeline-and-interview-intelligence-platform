import { ApiProperty } from '@nestjs/swagger';

import { BulkOperationFailureDto } from './bulk-operation-failure.dto';
import { BulkOperationSummaryDto } from './bulk-operation-summary.dto';

export class BulkAddSkillsCandidateResultDto {
  @ApiProperty({ example: '8f7f3de0-1c2b-4e88-9b26-2f1a4d7c7e33' })
  candidate_id: string;

  @ApiProperty({
    type: [String],
    description: 'Skill UUIDs newly created for the candidate',
  })
  added_skill_ids: string[];

  @ApiProperty({
    type: [String],
    description: 'Skill UUIDs reactivated from soft-deleted mappings',
  })
  reactivated_skill_ids: string[];

  @ApiProperty({
    type: [String],
    description: 'Skill UUIDs already present and therefore skipped',
  })
  skipped_existing_skill_ids: string[];
}

export class BulkAddSkillsResponseDto {
  @ApiProperty({
    type: [String],
    description:
      'Skill UUIDs that were invalid (format or not found) and skipped for all candidates',
  })
  invalid_skill_ids: string[];

  @ApiProperty({ type: [BulkAddSkillsCandidateResultDto] })
  results: BulkAddSkillsCandidateResultDto[];

  @ApiProperty({ type: [BulkOperationFailureDto] })
  failed: BulkOperationFailureDto[];

  @ApiProperty({ type: BulkOperationSummaryDto })
  summary: BulkOperationSummaryDto;
}
