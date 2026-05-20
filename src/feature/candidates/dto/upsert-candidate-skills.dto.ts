import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { CandidateSkillInputDto } from './candidate-skill.input.dto';

export class UpsertCandidateSkillsDto {
  @ApiProperty({ type: [CandidateSkillInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateSkillInputDto)
  skills: CandidateSkillInputDto[];
}
