import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { CandidateDocumentRepository } from '../../candidates/repositories/candidate-document.repository';

@Injectable()
export class CandidateResumeValidationHelper {
  constructor(
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
  ) {}

  async ensureLatestResumeExists(options: {
    candidateId: string;
    manager: EntityManager;
  }): Promise<void> {
    const hasResume = await this.candidateDocumentRepository.existsLatestResume(
      {
        candidateId: options.candidateId,
        manager: options.manager,
      },
    );

    if (!hasResume) {
      throw new ConflictException({
        message: 'Candidate resume is required before scheduling interview',
        code: 'CANDIDATE_RESUME_REQUIRED',
      });
    }
  }
}
