import { Injectable, NotFoundException } from '@nestjs/common';

import { CandidateRepository } from '../../repositories/candidate.repository';

@Injectable()
export class FindCandidateByIdUseCase {
  constructor(private readonly candidateRepository: CandidateRepository) {}

  async execute(id: string) {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) {
      throw new NotFoundException({
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND',
      });
    }
    return candidate;
  }
}
