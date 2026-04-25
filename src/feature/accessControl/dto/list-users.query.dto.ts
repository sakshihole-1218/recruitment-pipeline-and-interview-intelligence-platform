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
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { normalizeSearch } from '../../../common/utils/normalization.util';
import { SystemRoleCode } from '../enums/system-role-code.enum';

const USER_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'email',
  'first_name',
  'last_name',
  'last_login_at',
] as const;

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ example: 'sakshi' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ enum: SystemRoleCode, example: SystemRoleCode.RECRUITER })
  @IsOptional()
  @IsEnum(SystemRoleCode)
  role_code?: SystemRoleCode;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: USER_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  override sort_by?: (typeof USER_SORT_FIELDS)[number] = 'created_at';
}
