import { Injectable } from '@nestjs/common';

import { CandidateInterviewInviteEntity } from '../../entities/candidate-interview-invite.entity';
import { CandidateInterviewInviteStatus } from '../../enums/candidate-interview-invite-status.enum';
import { CandidateInterviewInviteRepository } from '../../repositories/candidate-interview-invite.repository';

@Injectable()
export class MarkCandidateInterviewInviteAccessedUseCase {
  constructor(private readonly repository: CandidateInterviewInviteRepository) {}

  async execute(invite: CandidateInterviewInviteEntity) {
    const now = new Date();
    invite.first_accessed_at = invite.first_accessed_at ?? now;
    invite.last_accessed_at = now;
    if (invite.status === CandidateInterviewInviteStatus.ACTIVE) {
      invite.status = CandidateInterviewInviteStatus.USED;
    }
    return this.repository.save(invite);
  }
}
