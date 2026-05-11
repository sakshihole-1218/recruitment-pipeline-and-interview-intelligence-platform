import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateSkillRepository } from '../../repositories/candidate-skill.repository';
import { CandidateReferenceRepository } from '../../repositories/candidate-reference.repository';
import { CandidatesValidationHelper } from '../../helpers/candidates-validation.helper';
import { CandidateSkillInputDto } from '../../dto/candidate-skill.input.dto';

@Injectable()
export class UpsertCandidateSkillsUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateSkillRepository: CandidateSkillRepository,
    private readonly referenceRepository: CandidateReferenceRepository,
    private readonly validationHelper: CandidatesValidationHelper,
  ) {}

  async execute(
    candidateId: string,
    skills: CandidateSkillInputDto[],
  ) {
    return this.dataSource.transaction(async (manager) => {
      const candidate = await this.candidateRepository.findById(candidateId, { manager });
      if (!candidate) {
        throw new NotFoundException({
          message: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      const normalized = this.validationHelper.dedupeAndValidateSkills(skills);
      const skillIds = normalized.map((s) => s.skill_id);
      const existingSkills = await this.referenceRepository.findSkillsByIds(skillIds, manager);

      if (existingSkills.length !== skillIds.length) {
        throw new BadRequestException({
          message: 'One or more skills are invalid',
          code: 'INVALID_SKILL_ID',
        });
      }

      for (const input of normalized) {
        const current = await this.candidateSkillRepository.findByCandidateAndSkill({
          candidateId,
          skillId: input.skill_id,
          includeDeleted: true,
          manager,
        });

        const years =
          input.years_of_experience === undefined || input.years_of_experience === null
            ? null
            : String(input.years_of_experience);

        if (current) {
          current.deleted_at = null;
          current.years_of_experience = years;
          current.proficiency_level = input.proficiency_level ?? null;
          current.is_primary = input.is_primary ?? false;
          await this.candidateSkillRepository.save(current, { manager });
        } else {
          await this.candidateSkillRepository.createAndSave(
            {
              candidate_id: candidateId,
              skill_id: input.skill_id,
              years_of_experience: years,
              proficiency_level: input.proficiency_level ?? null,
              is_primary: input.is_primary ?? false,
            },
            { manager },
          );
        }
      }

      return this.candidateSkillRepository.listByCandidateId(candidateId, { manager });
    });
  }
}
