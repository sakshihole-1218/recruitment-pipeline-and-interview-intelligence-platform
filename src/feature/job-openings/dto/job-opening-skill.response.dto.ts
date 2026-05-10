import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SkillProficiencyLevel } from '../enums/skill-proficiency-level.enum';

export class JobOpeningSkillResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Skill UUID' })
  skill_id: string;

  @ApiProperty({ enum: SkillProficiencyLevel, example: SkillProficiencyLevel.INTERMEDIATE })
  proficiency_level: SkillProficiencyLevel;

  @ApiProperty({ example: true })
  is_mandatory: boolean;

  @ApiPropertyOptional({ example: 2 })
  years_of_experience_required: number | null;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Skill name', example: 'TypeScript' })
  skill_name?: string;

  @ApiPropertyOptional({ description: 'Skill code', example: 'TYPESCRIPT' })
  skill_code?: string;

  @ApiPropertyOptional({ description: 'Skill category', example: 'LANGUAGE' })
  skill_category?: string;
}
