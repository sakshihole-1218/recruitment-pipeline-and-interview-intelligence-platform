import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../../accessControl/enums/system-role-code.enum';

import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateDocumentRepository } from '../../repositories/candidate-document.repository';

@Injectable()
export class ListCandidateDocumentsUseCase {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async execute(candidateId: string, actor?: AuthJwtPayload) {
    const candidate = await this.candidateRepository.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException({
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND',
      });
    }

    if (actor && actor.roles.includes(SystemRoleCode.INTERVIEWER) && !actor.roles.includes(SystemRoleCode.ADMIN) && !actor.roles.includes(SystemRoleCode.RECRUITER) && !actor.roles.includes(SystemRoleCode.HIRING_MANAGER)) {
      const isScheduled = await this.entityManager.query(
        `SELECT 1
         FROM applications a
         JOIN interviews i ON i.application_id = a.id
         JOIN interview_panel_members pm ON pm.interview_id = i.id
         WHERE a.candidate_id = $1
           AND pm.interviewer_user_id = $2
           AND i.deleted_at IS NULL
         LIMIT 1`,
        [candidateId, actor.sub]
      );
      
      if (!isScheduled || isScheduled.length === 0) {
        throw new ForbiddenException({
          message: 'You are not scheduled for an interview with this candidate',
          code: 'FORBIDDEN',
        });
      }
    }

    return this.candidateDocumentRepository.listByCandidateId(candidateId);
  }
}
