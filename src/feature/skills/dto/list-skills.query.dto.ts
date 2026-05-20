import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { normalizeSearch } from '../../../common/utils/normalization.util';
import { SkillCategory } from '../enums/skill-category.enum';

const SKILL_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'name',
  'code',
  'category',
  'is_active',
] as const;

export class ListSkillsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ example: 'Type', description: 'Filter by name (partial match)' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'TYPESCRIPT', description: 'Filter by exact code' })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ enum: SkillCategory, example: SkillCategory.LANGUAGE })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: SKILL_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(SKILL_SORT_FIELDS)
  override sort_by?: (typeof SKILL_SORT_FIELDS)[number] = 'created_at';
}
