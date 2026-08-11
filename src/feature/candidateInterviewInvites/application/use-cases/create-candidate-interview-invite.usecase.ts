import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { DataSource } from 'typeorm';

import { AiInterviewSessionsService } from '../../../aiInterviewSessions/application/services/ai-interview-sessions.service';
import { CandidateInterviewInviteEntity } from '../../entities/candidate-interview-invite.entity';
import { CandidateInterviewInviteStatus } from '../../enums/candidate-interview-invite-status.enum';
import { CandidateInterviewInviteRepository } from '../../repositories/candidate-interview-invite.repository';
import { CandidateInterviewInvitesReferenceRepository } from '../../repositories/candidate-interview-invites-reference.repository';

@Injectable()
export class CreateCandidateInterviewInviteUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: CandidateInterviewInviteRepository,
    private readonly referenceRepository: CandidateInterviewInvitesReferenceRepository,
    private readonly aiInterviewSessionsService: AiInterviewSessionsService,
  ) {}

  async execute(
    interviewId: string,
    actorUserId?: string,
  ): Promise<{ invite: CandidateInterviewInviteEntity; rawToken: string }> {
    const interview = await this.referenceRepository.findInterviewById(interviewId);

    if (!interview) {
      throw new NotFoundException({
        message: 'Interview not found',
        code: 'INTERVIEW_NOT_FOUND',
      });
    }

    if (!interview.is_ai_interview) {
      throw new BadRequestException({
        message: 'Candidate invite can only be created for AI interviews',
        code: 'INTERVIEW_NOT_AI_INTERVIEW',
      });
    }

    const application = await this.referenceRepository.findApplicationById(
      interview.application_id,
    );
    if (!application) {
      throw new NotFoundException({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND',
      });
    }

    const candidate = await this.referenceRepository.findCandidateById(
      application.candidate_id,
    );
    if (!candidate) {
      throw new NotFoundException({
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND',
      });
    }

    let session =
      await this.referenceRepository.findActiveAiSessionByInterviewId(
        interview.id,
      );

    if (!session) {
      session = await this.aiInterviewSessionsService.create(
        { interview_id: interview.id },
        actorUserId,
      );
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const validFrom = new Date(
      interview.scheduled_start_at.getTime() - 30 * 60 * 1000,
    );
    const expiresAt = new Date(
      interview.scheduled_end_at.getTime() + 24 * 60 * 60 * 1000,
    );

    const invite = await this.dataSource.transaction(async (manager) => {
      const existingActive = await this.repository.findActiveByInterviewId(
        interview.id,
        manager,
      );

      if (existingActive) {
        existingActive.status = CandidateInterviewInviteStatus.REVOKED;
        existingActive.revoked_at = new Date();
        existingActive.updated_by_user_id = actorUserId ?? null;
        await this.repository.save(existingActive, manager);
      }

      return this.repository.create(
        {
          interview_id: interview.id,
          ai_interview_session_id: session!.id,
          candidate_id: candidate.id,
          token_hash: tokenHash,
          public_token: rawToken,
          status: CandidateInterviewInviteStatus.ACTIVE,
          valid_from: validFrom,
          expires_at: expiresAt,
          first_accessed_at: null,
          last_accessed_at: null,
          completed_at: null,
          revoked_at: null,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: actorUserId ?? null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        manager,
      );
    });

    const loaded = await this.repository.findById(invite.id);
    if (!loaded) {
      throw new NotFoundException({
        message: 'Created interview invite could not be loaded',
        code: 'CANDIDATE_INTERVIEW_INVITE_LOAD_FAILED',
      });
    }

    return { invite: loaded, rawToken };
  }
}
