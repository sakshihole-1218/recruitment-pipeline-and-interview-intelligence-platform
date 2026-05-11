import { Injectable, NotFoundException } from '@nestjs/common';

import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateDocumentRepository } from '../../repositories/candidate-document.repository';

@Injectable()
export class ListCandidateDocumentsUseCase {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
  ) {}

  async execute(candidateId: string) {
    const candidate = await this.candidateRepository.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException({
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND',
      });
    }

    return this.candidateDocumentRepository.listByCandidateId(candidateId);
  }
}
