import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { JobOpeningSkillEntity } from '../entities/job-opening-skill.entity';
import { SkillProficiencyLevel } from '../enums/skill-proficiency-level.enum';

@Injectable()
export class JobOpeningSkillRepository {
  constructor(
    @InjectRepository(JobOpeningSkillEntity)
    private readonly repository: Repository<JobOpeningSkillEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<JobOpeningSkillEntity> {
    return manager
      ? manager.getRepository(JobOpeningSkillEntity)
      : this.repository;
  }

  async softDeleteByJobOpeningId(jobOpeningId: string, options: { manager: EntityManager }): Promise<void> {
    await this.repo(options.manager)
      .createQueryBuilder()
      .update(JobOpeningSkillEntity)
      .set({ deleted_at: () => 'now()' })
      .where('job_opening_id = :jobOpeningId', { jobOpeningId })
      .andWhere('deleted_at IS NULL')
      .execute();
  }

  async replaceSkills(options: {
    jobOpeningId: string;
    skills: Array<{
      skill_id: string;
      proficiency_level: SkillProficiencyLevel;
      is_mandatory: boolean;
      years_of_experience_required: number | null;
    }>;
    manager: EntityManager;
  }): Promise<void> {
    await this.softDeleteByJobOpeningId(options.jobOpeningId, {
      manager: options.manager,
    });

    if (!options.skills.length) {
      return;
    }

    const rows = options.skills.map((s) =>
      this.repo(options.manager).create({
        job_opening_id: options.jobOpeningId,
        skill_id: s.skill_id,
        proficiency_level: s.proficiency_level,
        is_mandatory: s.is_mandatory,
        years_of_experience_required: s.years_of_experience_required,
        deleted_at: null,
      }),
    );

    await this.repo(options.manager).save(rows);
  }
}
