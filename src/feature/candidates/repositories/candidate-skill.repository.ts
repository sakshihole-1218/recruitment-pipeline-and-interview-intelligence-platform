import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { CandidateSkillEntity } from '../entities/candidate-skill.entity';

@Injectable()
export class CandidateSkillRepository {
  constructor(
    @InjectRepository(CandidateSkillEntity)
    private readonly repository: Repository<CandidateSkillEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<CandidateSkillEntity> {
    return manager
      ? manager.getRepository(CandidateSkillEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'candidate_skills',
    manager?: EntityManager,
  ): SelectQueryBuilder<CandidateSkillEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findByCandidateAndSkill(options: {
    candidateId: string;
    skillId: string;
    includeDeleted?: boolean;
    manager?: EntityManager;
  }): Promise<CandidateSkillEntity | null> {
    const qb = this.repo(options.manager)
      .createQueryBuilder('candidate_skills')
      .where('candidate_skills.candidate_id = :candidateId', {
        candidateId: options.candidateId,
      })
      .andWhere('candidate_skills.skill_id = :skillId', {
        skillId: options.skillId,
      });

    if (!(options.includeDeleted ?? false)) {
      qb.andWhere('candidate_skills.deleted_at IS NULL');
    }

    return qb.getOne();
  }

  async findByCandidateAndSkillIds(options: {
    candidateId: string;
    skillIds: string[];
    includeDeleted?: boolean;
    manager?: EntityManager;
  }): Promise<CandidateSkillEntity[]> {
    const ids = Array.isArray(options.skillIds)
      ? options.skillIds.filter(Boolean)
      : [];
    if (!ids.length) return [];

    const qb = this.repo(options.manager)
      .createQueryBuilder('candidate_skills')
      .where('candidate_skills.candidate_id = :candidateId', {
        candidateId: options.candidateId,
      })
      .andWhere('candidate_skills.skill_id IN (:...skillIds)', {
        skillIds: ids,
      });

    if (!(options.includeDeleted ?? false)) {
      qb.andWhere('candidate_skills.deleted_at IS NULL');
    }

    return qb.getMany();
  }

  async listByCandidateId(
    candidateId: string,
    options?: { manager?: EntityManager },
  ): Promise<CandidateSkillEntity[]> {
    return this.baseQuery('candidate_skills', options?.manager)
      .leftJoinAndSelect('candidate_skills.skill', 'skills')
      .andWhere('candidate_skills.candidate_id = :candidateId', { candidateId })
      .orderBy('candidate_skills.is_primary', 'DESC')
      .addOrderBy('candidate_skills.updated_at', 'DESC')
      .getMany();
  }

  async save(
    entity: CandidateSkillEntity,
    options?: { manager?: EntityManager },
  ): Promise<CandidateSkillEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<CandidateSkillEntity>,
    options?: { manager?: EntityManager },
  ): Promise<CandidateSkillEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async softDeleteByCandidateId(
    candidateId: string,
    options?: { manager?: EntityManager },
  ): Promise<void> {
    await this.repo(options?.manager)
      .createQueryBuilder()
      .update(CandidateSkillEntity)
      .set({ deleted_at: () => 'CURRENT_TIMESTAMP' })
      .where('candidate_id = :candidateId', { candidateId })
      .andWhere('deleted_at IS NULL')
      .execute();
  }
}
