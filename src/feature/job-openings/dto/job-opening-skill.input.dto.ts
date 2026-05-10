import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { SkillProficiencyLevel } from '../enums/skill-proficiency-level.enum';

export class JobOpeningSkillInputDto {
  @ApiProperty({ description: 'Skill UUID' })
  @IsUUID()
  skill_id: string;

  @ApiProperty({ enum: SkillProficiencyLevel, example: SkillProficiencyLevel.INTERMEDIATE })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(SkillProficiencyLevel)
  proficiency_level: SkillProficiencyLevel;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_mandatory?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Years of experience required for this skill' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  years_of_experience_required?: number;
}
