import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ActivityActionType } from '../enums/activity-action-type.enum';
import { ActivityEntityType } from '../enums/activity-entity-type.enum';

const ACTIVITY_LOG_SORT_FIELDS = [
  'created_at',
  'action_at',
  'entity_type',
  'action_type',
] as const;

export class ListActivityLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ enum: ActivityEntityType })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(ActivityEntityType)
  entity_type?: ActivityEntityType;

  @ApiPropertyOptional({ description: 'Entity UUID' })
  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @ApiPropertyOptional({ enum: ActivityActionType })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(ActivityActionType)
  action_type?: ActivityActionType;

  @ApiPropertyOptional({ description: 'Actor user UUID' })
  @IsOptional()
  @IsUUID()
  action_by_user_id?: string;

  @ApiPropertyOptional({ description: 'Filter by action_at from (inclusive)', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  action_from?: string;

  @ApiPropertyOptional({ description: 'Filter by action_at to (inclusive)', example: '2026-01-31T23:59:59.000Z' })
  @IsOptional()
  @IsISO8601()
  action_to?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: ACTIVITY_LOG_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(ACTIVITY_LOG_SORT_FIELDS)
  override sort_by?: (typeof ACTIVITY_LOG_SORT_FIELDS)[number] = 'created_at';
}
