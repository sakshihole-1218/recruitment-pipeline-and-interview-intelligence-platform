import { ApiProperty } from '@nestjs/swagger';

export class BulkOperationSummaryDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 7 })
  success_count: number;

  @ApiProperty({ example: 3 })
  failed_count: number;
}
