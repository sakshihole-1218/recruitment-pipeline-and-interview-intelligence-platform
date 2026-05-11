import { ApiProperty } from '@nestjs/swagger';

export class RemoveCandidateSkillResponseDto {
  @ApiProperty({ description: 'Candidate UUID' })
  candidate_id: string;

  @ApiProperty({ description: 'Skill UUID' })
  skill_id: string;
}
