import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { JobOpeningEntity } from '../../job-openings/entities/job-opening.entity';
import { JobOpeningStatus } from '../../job-openings/enums/job-opening-status.enum';
import { UserEntity } from '../../accessControl/entities/user.entity';

@Injectable()
export class ApplicationReferenceRepository {
  async candidateExists(
    candidateId: string,
    manager: EntityManager,
  ): Promise<boolean> {
    const repo = manager.getRepository(CandidateEntity);
    const candidate = await repo
      .createQueryBuilder('candidates')
      .select(['candidates.id'])
      .where('candidates.id = :id', { id: candidateId })
      .andWhere('candidates.deleted_at IS NULL')
      .getOne();

    return Boolean(candidate);
  }

  async jobOpeningExists(
    jobOpeningId: string,
    manager: EntityManager,
  ): Promise<boolean> {
    const repo = manager.getRepository(JobOpeningEntity);
    const opening = await repo
      .createQueryBuilder('job_openings')
      .select(['job_openings.id'])
      .where('job_openings.id = :id', { id: jobOpeningId })
      .andWhere('job_openings.deleted_at IS NULL')
      .getOne();

    return Boolean(opening);
  }

  async jobOpeningIsOpen(
    jobOpeningId: string,
    manager: EntityManager,
  ): Promise<boolean> {
    const repo = manager.getRepository(JobOpeningEntity);
    const opening = await repo
      .createQueryBuilder('job_openings')
      .select(['job_openings.id'])
      .where('job_openings.id = :id', { id: jobOpeningId })
      .andWhere('job_openings.deleted_at IS NULL')
      .andWhere('job_openings.status = :status', {
        status: JobOpeningStatus.OPEN,
      })
      .getOne();

    return Boolean(opening);
  }

  async userExists(userId: string, manager: EntityManager): Promise<boolean> {
    const repo = manager.getRepository(UserEntity);
    const user = await repo
      .createQueryBuilder('users')
      .select(['users.id'])
      .where('users.id = :id', { id: userId })
      .andWhere('users.deleted_at IS NULL')
      .getOne();

    return Boolean(user);
  }
}
