import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CandidateEntity } from '../../entities/candidate.entity';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateSkillRepository } from '../../repositories/candidate-skill.repository';
import { CandidateDocumentRepository } from '../../repositories/candidate-document.repository';

@Injectable()
export class SoftDeleteCandidateUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateSkillRepository: CandidateSkillRepository,
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const candidate = await this.candidateRepository.findById(id, { manager });
      if (!candidate) {
        throw new NotFoundException({
          message: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      await manager
        .getRepository(CandidateEntity)
        .createQueryBuilder()
        .update(CandidateEntity)
        .set({
          deleted_at: () => 'CURRENT_TIMESTAMP',
          deleted_by_user_id: actorUserId ?? null,
          is_active: false,
          updated_at: () => 'CURRENT_TIMESTAMP',
          updated_by_user_id: actorUserId ?? null,
        })
        .where('id = :id', { id })
        .andWhere('deleted_at IS NULL')
        .execute();

      await this.candidateSkillRepository.softDeleteByCandidateId(id, { manager });
      await this.candidateDocumentRepository.softDeleteByCandidateId(id, { manager });
    });
  }
}
