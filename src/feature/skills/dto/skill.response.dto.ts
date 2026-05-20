import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SkillCategory } from '../enums/skill-category.enum';

export class SkillResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ example: 'TypeScript' })
  name: string;

  @ApiProperty({ example: 'TYPESCRIPT' })
  code: string;

  @ApiPropertyOptional({ example: 'Strongly typed JavaScript superset' })
  description: string | null;

  @ApiProperty({ enum: SkillCategory, example: SkillCategory.LANGUAGE })
  category: SkillCategory;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
