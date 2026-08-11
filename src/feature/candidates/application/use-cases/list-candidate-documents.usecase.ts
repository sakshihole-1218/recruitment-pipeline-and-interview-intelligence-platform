import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';

import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateDocumentRepository } from '../../repositories/candidate-document.repository';

@Injectable()
export class ListCandidateDocumentsUseCase {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(candidateId: string, actor?: AuthJwtPayload) {
    const candidate = await this.candidateRepository.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException({
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND',
      });
    }

    await this.interviewerAccessValidationHelper.assertCanAccessCandidate(
      actor,
      candidateId,
    );

    return this.candidateDocumentRepository.listByCandidateId(candidateId);
  }
}
