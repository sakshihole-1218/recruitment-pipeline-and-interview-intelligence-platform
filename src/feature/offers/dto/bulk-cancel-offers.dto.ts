import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class BulkCancelOffersDto {
  @ApiProperty({
    description: 'Offer UUIDs',
    type: [String],
    example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  offer_ids: string[];

  @ApiProperty({
    description: 'Reason for cancelling the offer(s)',
    example: 'Budget approved role is no longer open',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  cancel_reason: string;
}
