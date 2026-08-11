import { Injectable, NotFoundException } from '@nestjs/common';

import { CandidateInterviewInviteRepository } from '../../repositories/candidate-interview-invite.repository';
import { CreateCandidateInterviewInviteUseCase } from './create-candidate-interview-invite.usecase';
import { CandidateInterviewInviteStatus } from '../../enums/candidate-interview-invite-status.enum';

@Injectable()
export class RegenerateCandidateInterviewInviteUseCase {
  constructor(
    private readonly repository: CandidateInterviewInviteRepository,
    private readonly createUseCase: CreateCandidateInterviewInviteUseCase,
  ) {}

  async execute(id: string, actorUserId?: string) {
    const invite = await this.repository.findById(id);
    if (!invite) {
      throw new NotFoundException({
        message: 'Candidate interview invite not found',
        code: 'CANDIDATE_INTERVIEW_INVITE_NOT_FOUND',
      });
    }

    invite.status = CandidateInterviewInviteStatus.REVOKED;
    invite.revoked_at = new Date();
    invite.updated_by_user_id = actorUserId ?? null;
    await this.repository.save(invite);

    return this.createUseCase.execute(invite.interview_id, actorUserId);
  }
}
