import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { CandidateInterviewInviteEntity } from '../entities/candidate-interview-invite.entity';
import { CandidateInterviewInviteStatus } from '../enums/candidate-interview-invite-status.enum';

@Injectable()
export class CandidateInterviewInviteRepository {
  constructor(
    @InjectRepository(CandidateInterviewInviteEntity)
    private readonly repository: Repository<CandidateInterviewInviteEntity>,
  ) {}

  private repo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(CandidateInterviewInviteEntity)
      : this.repository;
  }

  private baseQuery(alias = 'candidate_interview_invites', manager?: EntityManager) {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.candidate`, 'candidate')
      .leftJoinAndSelect(`${alias}.ai_interview_session`, 'ai_interview_session')
      .leftJoinAndSelect(`${alias}.interview`, 'interview')
      .leftJoinAndSelect('interview.application', 'application')
      .leftJoinAndSelect('application.job_opening', 'job_opening')
      .leftJoinAndSelect('interview.interview_round', 'interview_round')
      .where(`${alias}.deleted_at IS NULL`);
  }

  findById(id: string, manager?: EntityManager) {
    return this.baseQuery('candidate_interview_invites', manager)
      .andWhere('candidate_interview_invites.id = :id', { id })
      .getOne();
  }

  findByTokenHash(tokenHash: string, manager?: EntityManager) {
    return this.baseQuery('candidate_interview_invites', manager)
      .andWhere('candidate_interview_invites.token_hash = :tokenHash', {
        tokenHash,
      })
      .getOne();
  }

  findByPublicToken(publicToken: string, manager?: EntityManager) {
    return this.baseQuery('candidate_interview_invites', manager)
      .andWhere('candidate_interview_invites.public_token = :publicToken', {
        publicToken,
      })
      .getOne();
  }

  async findLatestByInterviewId(interviewId: string, manager?: EntityManager) {
    return this.baseQuery('candidate_interview_invites', manager)
      .andWhere('candidate_interview_invites.interview_id = :interviewId', {
        interviewId,
      })
      .orderBy('candidate_interview_invites.created_at', 'DESC')
      .getOne();
  }

  async findActiveByInterviewId(interviewId: string, manager?: EntityManager) {
    return this.baseQuery('candidate_interview_invites', manager)
      .andWhere('candidate_interview_invites.interview_id = :interviewId', {
        interviewId,
      })
      .andWhere('candidate_interview_invites.status = :status', {
        status: CandidateInterviewInviteStatus.ACTIVE,
      })
      .orderBy('candidate_interview_invites.created_at', 'DESC')
      .getOne();
  }

  create(payload: Partial<CandidateInterviewInviteEntity>, manager?: EntityManager) {
    const entity = this.repo(manager).create(payload);
    return this.repo(manager).save(entity);
  }

  save(entity: CandidateInterviewInviteEntity, manager?: EntityManager) {
    return this.repo(manager).save(entity);
  }
}
