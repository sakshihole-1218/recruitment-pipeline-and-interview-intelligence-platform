import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { CandidateSkillProficiencyLevel } from '../enums/candidate-skill-proficiency-level.enum';

export class CandidateSkillInputDto {
  @ApiProperty({ description: 'Skill UUID' })
  @IsUUID()
  skill_id: string;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(80)
  years_of_experience?: number;

  @ApiPropertyOptional({
    enum: CandidateSkillProficiencyLevel,
    example: CandidateSkillProficiencyLevel.INTERMEDIATE,
  })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(CandidateSkillProficiencyLevel)
  proficiency_level?: CandidateSkillProficiencyLevel;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_primary?: boolean;
}
