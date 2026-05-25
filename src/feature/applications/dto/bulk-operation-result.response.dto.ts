import { ApiProperty } from '@nestjs/swagger';

export class BulkOperationFailureDto {
  @ApiProperty({ description: 'Application UUID' })
  application_id: string;

  @ApiProperty({ example: 'Invalid stage transition' })
  reason: string;
}

export class BulkOperationResultResponseDto {
  @ApiProperty({ example: 95 })
  success_count: number;

  @ApiProperty({ example: 5 })
  failed_count: number;

  @ApiProperty({ type: [String], example: ['b3b0b2b0-8f5a-4b0a-a7a9-0f3dd1f9d4f0'] })
  successful_ids: string[];

  @ApiProperty({ type: [BulkOperationFailureDto] })
  failures: BulkOperationFailureDto[];
}
