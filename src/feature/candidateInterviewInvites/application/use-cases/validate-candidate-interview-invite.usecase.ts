import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';

import { CandidateInterviewInviteEntity } from '../../entities/candidate-interview-invite.entity';
import { CandidateInterviewInviteStatus } from '../../enums/candidate-interview-invite-status.enum';
import { CandidateInterviewInviteRepository } from '../../repositories/candidate-interview-invite.repository';

@Injectable()
export class ValidateCandidateInterviewInviteUseCase {
  constructor(private readonly repository: CandidateInterviewInviteRepository) {}

  async execute(token: string): Promise<CandidateInterviewInviteEntity> {
    if (!token?.trim()) {
      throw new BadRequestException({
        message: 'Interview link is invalid',
        code: 'CANDIDATE_INTERVIEW_INVITE_INVALID',
      });
    }

    let invite = await this.repository.findByPublicToken(token);
    if (!invite) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      invite = await this.repository.findByTokenHash(tokenHash);
    }

    if (!invite) {
      throw new NotFoundException({
        message: 'Interview link is invalid',
        code: 'CANDIDATE_INTERVIEW_INVITE_INVALID',
      });
    }

    const now = new Date();
    if (invite.revoked_at || invite.status === CandidateInterviewInviteStatus.REVOKED) {
      throw new BadRequestException({
        message: 'Interview link has been revoked',
        code: 'CANDIDATE_INTERVIEW_INVITE_REVOKED',
      });
    }

    if (invite.completed_at || invite.status === CandidateInterviewInviteStatus.COMPLETED) {
      throw new BadRequestException({
        message: 'Interview has already been completed',
        code: 'CANDIDATE_INTERVIEW_INVITE_COMPLETED',
      });
    }

    if (invite.expires_at.getTime() < now.getTime()) {
      invite.status = CandidateInterviewInviteStatus.EXPIRED;
      await this.repository.save(invite);
      throw new BadRequestException({
        message: 'Interview link has expired',
        code: 'CANDIDATE_INTERVIEW_INVITE_EXPIRED',
      });
    }

    if (invite.valid_from && invite.valid_from.getTime() > now.getTime()) {
      throw new BadRequestException({
        message: 'Interview link is not active yet',
        code: 'CANDIDATE_INTERVIEW_INVITE_NOT_ACTIVE_YET',
      });
    }

    return invite;
  }
}
