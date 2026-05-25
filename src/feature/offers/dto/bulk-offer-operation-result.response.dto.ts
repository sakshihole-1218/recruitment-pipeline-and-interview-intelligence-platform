import { ApiProperty } from '@nestjs/swagger';

export class BulkOfferOperationFailureDto {
  @ApiProperty({ description: 'Offer UUID' })
  offer_id: string;

  @ApiProperty({ description: 'Failure reason message' })
  reason: string;
}

export class BulkOfferOperationResultResponseDto {
  @ApiProperty({ example: 2 })
  success_count: number;

  @ApiProperty({ example: 1 })
  failed_count: number;

  @ApiProperty({ type: [String], description: 'Offer IDs processed successfully' })
  successful_ids: string[];

  @ApiProperty({ type: [BulkOfferOperationFailureDto] })
  failures: BulkOfferOperationFailureDto[];
}
