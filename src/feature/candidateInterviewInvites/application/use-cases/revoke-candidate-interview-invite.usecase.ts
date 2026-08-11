import { Injectable, NotFoundException } from '@nestjs/common';

import { CandidateInterviewInviteStatus } from '../../enums/candidate-interview-invite-status.enum';
import { CandidateInterviewInviteRepository } from '../../repositories/candidate-interview-invite.repository';

@Injectable()
export class RevokeCandidateInterviewInviteUseCase {
  constructor(private readonly repository: CandidateInterviewInviteRepository) {}

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
    return this.repository.save(invite);
  }
}
