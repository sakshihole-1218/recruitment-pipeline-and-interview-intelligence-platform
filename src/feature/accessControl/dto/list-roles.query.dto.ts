import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { normalizeSearch } from '../../../common/utils/normalization.util';

const ROLE_SORT_FIELDS = ['created_at', 'updated_at', 'code', 'name'] as const;

export class ListRolesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: ROLE_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(ROLE_SORT_FIELDS)
  override sort_by?: (typeof ROLE_SORT_FIELDS)[number] = 'created_at';
}
