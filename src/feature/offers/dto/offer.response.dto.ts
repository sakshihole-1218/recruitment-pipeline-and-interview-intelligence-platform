import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { OfferStatus } from '../enums/offer-status.enum';

export class OfferResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Application UUID' })
  application_id: string;

  @ApiProperty({ example: 'Senior Backend Engineer' })
  offered_role_title: string;

  @ApiProperty({ example: '2800000.00' })
  offered_ctc: string;

  @ApiPropertyOptional({ example: '100000.00', nullable: true })
  joining_bonus: string | null;

  @ApiPropertyOptional({ example: 'INR', nullable: true })
  currency_code: string | null;

  @ApiPropertyOptional({ example: 6, nullable: true })
  probation_period_months: number | null;

  @ApiProperty({ example: '2026-12-01T00:00:00.000Z' })
  expected_joining_date: Date;

  @ApiProperty({ enum: OfferStatus, example: OfferStatus.DRAFT })
  offer_status: OfferStatus;

  @ApiPropertyOptional({ example: '2026-01-15T10:30:00.000Z', nullable: true })
  offered_at: Date | null;

  @ApiPropertyOptional({ example: '2026-01-16T10:30:00.000Z', nullable: true })
  accepted_at: Date | null;

  @ApiPropertyOptional({ example: '2026-01-16T10:30:00.000Z', nullable: true })
  declined_at: Date | null;

  @ApiPropertyOptional({ example: 'Accepted another offer', nullable: true })
  decline_reason: string | null;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
