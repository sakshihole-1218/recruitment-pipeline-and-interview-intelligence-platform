import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsUUID,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { OfferStatus } from '../enums/offer-status.enum';

const OFFER_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'offered_at',
  'expected_joining_date',
  'offer_status',
] as const;

export class ListOffersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Filter by application UUID' })
  @IsOptional()
  @IsUUID()
  application_id?: string;

  @ApiPropertyOptional({ enum: OfferStatus })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(OfferStatus)
  offer_status?: OfferStatus;

  @ApiPropertyOptional({
    description: 'Filter offers with expected_joining_date >= this date (ISO)',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  expected_joining_from?: string;

  @ApiPropertyOptional({
    description: 'Filter offers with expected_joining_date <= this date (ISO)',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  expected_joining_to?: string;

  @ApiPropertyOptional({
    description: 'Filter offers with offered_at >= this date (ISO)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  offered_from?: string;

  @ApiPropertyOptional({
    description: 'Filter offers with offered_at <= this date (ISO)',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  offered_to?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: OFFER_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(OFFER_SORT_FIELDS)
  override sort_by?: (typeof OFFER_SORT_FIELDS)[number] = 'created_at';
}
