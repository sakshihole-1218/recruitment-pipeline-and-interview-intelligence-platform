import { Injectable, NotFoundException } from '@nestjs/common';

import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateSkillRepository } from '../../repositories/candidate-skill.repository';

@Injectable()
export class ListCandidateSkillsUseCase {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateSkillRepository: CandidateSkillRepository,
  ) {}

  async execute(candidateId: string) {
    const candidate = await this.candidateRepository.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException({
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND',
      });
    }

    return this.candidateSkillRepository.listByCandidateId(candidateId);
  }
}
