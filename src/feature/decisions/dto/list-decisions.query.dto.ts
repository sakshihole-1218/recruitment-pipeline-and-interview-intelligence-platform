import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { DecisionStatus } from '../enums/decision-status.enum';

const DECISION_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'decision_at',
  'decision_status',
] as const;

export class ListDecisionsQueryDto extends PaginationQueryDto {
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

  @ApiPropertyOptional({ enum: DecisionStatus })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(DecisionStatus)
  decision_status?: DecisionStatus;

  @ApiPropertyOptional({ description: 'Filter by decided-by user UUID' })
  @IsOptional()
  @IsUUID()
  decided_by_user_id?: string;

  @ApiPropertyOptional({
    description: 'Filter decisions where decision_at >= decision_from',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  decision_from?: string;

  @ApiPropertyOptional({
    description: 'Filter decisions where decision_at <= decision_to',
    example: '2026-01-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  decision_to?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: DECISION_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(DECISION_SORT_FIELDS)
  override sort_by?: (typeof DECISION_SORT_FIELDS)[number] = 'created_at';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(['asc', 'desc'])
  override sort_order?: 'asc' | 'desc' = 'desc';
}
