import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CandidateSkillEntity } from '../../entities/candidate-skill.entity';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateSkillRepository } from '../../repositories/candidate-skill.repository';

@Injectable()
export class RemoveCandidateSkillUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateSkillRepository: CandidateSkillRepository,
  ) {}

  async execute(candidateId: string, skillId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const candidate = await this.candidateRepository.findById(candidateId, { manager });
      if (!candidate) {
        throw new NotFoundException({
          message: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      const current = await this.candidateSkillRepository.findByCandidateAndSkill({
        candidateId,
        skillId,
        includeDeleted: false,
        manager,
      });

      if (!current) {
        throw new NotFoundException({
          message: 'Candidate skill not found',
          code: 'CANDIDATE_SKILL_NOT_FOUND',
        });
      }

      await manager
        .getRepository(CandidateSkillEntity)
        .createQueryBuilder()
        .update(CandidateSkillEntity)
        .set({ deleted_at: () => 'CURRENT_TIMESTAMP', updated_at: () => 'CURRENT_TIMESTAMP' })
        .where('id = :id', { id: current.id })
        .andWhere('deleted_at IS NULL')
        .execute();
    });
  }
}
