import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { normalizeSearch } from '../../../common/utils/normalization.util';

const DEPARTMENT_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'name',
  'code',
  'is_active',
] as const;

export class ListDepartmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ example: 'eng', description: 'Search by name or code' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: 'ENG', description: 'Filter by department code' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value, obj, key }) => {
    const raw = (obj as Record<string, unknown> | undefined)?.[String(key)];
    if (raw === 'true' || raw === true) return true;
    if (raw === 'false' || raw === false) return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: DEPARTMENT_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(DEPARTMENT_SORT_FIELDS)
  override sort_by?: (typeof DEPARTMENT_SORT_FIELDS)[number] = 'created_at';
}
