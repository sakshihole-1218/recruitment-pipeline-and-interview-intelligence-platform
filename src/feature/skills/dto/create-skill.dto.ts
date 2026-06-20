import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { normalizeSearch } from '../../../common/utils/normalization.util';
import { SkillCategory } from '../enums/skill-category.enum';

export class CreateSkillDto {
  @ApiProperty({ example: 'TypeScript' })
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'TYPESCRIPT', description: 'Unique skill code.' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ example: 'Strongly typed JavaScript superset' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    return String(value).trim();
  })
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: SkillCategory, example: SkillCategory.LANGUAGE })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;
}
