import { ApiProperty } from '@nestjs/swagger';

import { CandidateResponseDto } from './candidate.response.dto';
import { BulkOperationFailureDto } from './bulk-operation-failure.dto';
import { BulkOperationSummaryDto } from './bulk-operation-summary.dto';

export class BulkCreateCandidatesResponseDto {
  @ApiProperty({ type: [CandidateResponseDto] })
  created: CandidateResponseDto[];

  @ApiProperty({ type: [BulkOperationFailureDto] })
  failed: BulkOperationFailureDto[];

  @ApiProperty({ type: BulkOperationSummaryDto })
  summary: BulkOperationSummaryDto;
}
