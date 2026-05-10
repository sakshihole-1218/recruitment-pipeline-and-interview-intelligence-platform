import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { JobOpeningSkillInputDto } from './job-opening-skill.input.dto';

export class ReplaceJobOpeningSkillsDto {
  @ApiProperty({ type: [JobOpeningSkillInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobOpeningSkillInputDto)
  skills: JobOpeningSkillInputDto[];
}
