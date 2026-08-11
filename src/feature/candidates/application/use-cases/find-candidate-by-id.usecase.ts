import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { CandidateRepository } from '../../repositories/candidate.repository';

@Injectable()
export class FindCandidateByIdUseCase {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(id: string, actor?: AuthJwtPayload) {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) {
      throw new NotFoundException({
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND',
      });
    }
    await this.interviewerAccessValidationHelper.assertCanAccessCandidate(
      actor,
      id,
    );
    return candidate;
  }
}
