import { ApiProperty } from '@nestjs/swagger';

import { BulkOperationFailureDto } from './bulk-operation-failure.dto';
import { BulkOperationSummaryDto } from './bulk-operation-summary.dto';

export class BulkUpdateCandidateStatusItemDto {
  @ApiProperty({ example: '8f7f3de0-1c2b-4e88-9b26-2f1a4d7c7e33' })
  candidate_id: string;

  @ApiProperty({ example: true })
  is_active: boolean;
}

export class BulkUpdateCandidateStatusResponseDto {
  @ApiProperty({ type: [BulkUpdateCandidateStatusItemDto] })
  updated: BulkUpdateCandidateStatusItemDto[];

  @ApiProperty({ type: [BulkOperationFailureDto] })
  failed: BulkOperationFailureDto[];

  @ApiProperty({ type: BulkOperationSummaryDto })
  summary: BulkOperationSummaryDto;
}
