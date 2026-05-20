import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { JobOpeningEntity } from '../../entities/job-opening.entity';
import { JobOpeningRepository } from '../../repositories/job-opening.repository';
import { JobOpeningSkillRepository } from '../../repositories/job-opening-skill.repository';
import { JobOpeningReferenceRepository } from '../../repositories/job-opening-reference.repository';
import { JobOpeningsValidationHelper } from '../../helpers/job-openings-validation.helper';
import { JobOpeningSkillInputDto } from '../../dto/job-opening-skill.input.dto';

@Injectable()
export class ReplaceJobOpeningSkillsUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jobOpeningRepository: JobOpeningRepository,
    private readonly jobOpeningSkillRepository: JobOpeningSkillRepository,
    private readonly referenceRepository: JobOpeningReferenceRepository,
    private readonly validationHelper: JobOpeningsValidationHelper,
  ) {}

  async execute(
    jobOpeningId: string,
    skillsInput: JobOpeningSkillInputDto[],
    actorUserId?: string,
  ): Promise<JobOpeningEntity> {
    return this.dataSource.transaction(async (manager) => {
      const opening = await this.jobOpeningRepository.findById(jobOpeningId, {
        manager,
      });

      if (!opening) {
        throw new NotFoundException({
          message: 'Job opening not found',
          code: 'JOB_OPENING_NOT_FOUND',
        });
      }

      const normalizedSkills = this.validationHelper.dedupeAndValidateSkills(
        skillsInput,
      );
      const skillIds = normalizedSkills.map((s) => s.skill_id);
      const skills = await this.referenceRepository.findSkillsByIds(
        skillIds,
        manager,
      );

      if (skills.length !== skillIds.length) {
        throw new BadRequestException({
          message: 'One or more skills are invalid',
          code: 'INVALID_SKILL_ID',
        });
      }

      await this.jobOpeningSkillRepository.replaceSkills({
        jobOpeningId,
        skills: normalizedSkills.map((s) => ({
          skill_id: s.skill_id,
          proficiency_level: s.proficiency_level,
          is_mandatory: s.is_mandatory ?? true,
          years_of_experience_required: s.years_of_experience_required ?? null,
        })),
        manager,
      });

      if (actorUserId) {
        await manager
          .getRepository(JobOpeningEntity)
          .createQueryBuilder()
          .update(JobOpeningEntity)
          .set({
            updated_by_user_id: actorUserId,
            updated_at: () => 'CURRENT_TIMESTAMP',
          })
          .where('id = :id', { id: opening.id })
          .execute();
      }

      const updated = await this.jobOpeningRepository.findById(jobOpeningId, {
        manager,
      });
      if (!updated) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'JOB_OPENING_POST_SKILLS_UPDATE_LOAD_FAILED',
        });
      }

      return updated;
    });
  }
}
