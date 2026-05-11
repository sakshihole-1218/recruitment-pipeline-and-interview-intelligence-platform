import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CandidateSkillProficiencyLevel } from '../enums/candidate-skill-proficiency-level.enum';

export class CandidateSkillResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Candidate UUID' })
  candidate_id: string;

  @ApiProperty({ description: 'Skill UUID' })
  skill_id: string;

  @ApiPropertyOptional({ example: '3.50', nullable: true })
  years_of_experience: string | null;

  @ApiPropertyOptional({ enum: CandidateSkillProficiencyLevel, nullable: true })
  proficiency_level: CandidateSkillProficiencyLevel | null;

  @ApiProperty({ example: false })
  is_primary: boolean;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ example: 'TypeScript', nullable: true })
  skill_name?: string | null;

  @ApiPropertyOptional({ example: 'TYPESCRIPT', nullable: true })
  skill_code?: string | null;
}
