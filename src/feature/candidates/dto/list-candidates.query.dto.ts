import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import {
  normalizeEmail,
  normalizePhoneE164,
  normalizeSearch,
} from '../../../common/utils/normalization.util';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CandidateSourceType } from '../enums/candidate-source-type.enum';

const CANDIDATE_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'first_name',
  'last_name',
  'email',
  'current_location',
  'total_experience_years',
  'is_active',
] as const;

export class ListCandidatesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ example: 'Sakshi' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ example: 'sakshi@example.com' })
  @IsOptional()
  @Transform(({ value }) => normalizeEmail(value))
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @Transform(({ value }) => normalizePhoneE164(value))
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ enum: CandidateSourceType, example: CandidateSourceType.LINKEDIN })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(CandidateSourceType)
  source_type?: CandidateSourceType;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(255)
  current_location?: string;

  @ApiPropertyOptional({ example: 5.5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  total_experience_years?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Filter candidates by skill UUID' })
  @IsOptional()
  @IsUUID()
  skill_id?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: CANDIDATE_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(CANDIDATE_SORT_FIELDS)
  override sort_by?: (typeof CANDIDATE_SORT_FIELDS)[number] = 'created_at';

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
