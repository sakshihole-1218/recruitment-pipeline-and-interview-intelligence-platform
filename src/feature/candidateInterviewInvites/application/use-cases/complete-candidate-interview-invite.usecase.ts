import { Injectable } from '@nestjs/common';

import { CandidateInterviewInviteEntity } from '../../entities/candidate-interview-invite.entity';
import { CandidateInterviewInviteStatus } from '../../enums/candidate-interview-invite-status.enum';
import { CandidateInterviewInviteRepository } from '../../repositories/candidate-interview-invite.repository';

@Injectable()
export class CompleteCandidateInterviewInviteUseCase {
  constructor(private readonly repository: CandidateInterviewInviteRepository) {}

  async execute(invite: CandidateInterviewInviteEntity) {
    invite.status = CandidateInterviewInviteStatus.COMPLETED;
    invite.completed_at = invite.completed_at ?? new Date();
    invite.last_accessed_at = new Date();
    return this.repository.save(invite);
  }
}
