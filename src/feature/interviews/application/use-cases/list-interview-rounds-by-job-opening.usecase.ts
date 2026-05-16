import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { JobOpeningEntity } from '../../../job-openings/entities/job-opening.entity';
import { InterviewRoundRepository } from '../../repositories/interview-round.repository';

@Injectable()
export class ListInterviewRoundsByJobOpeningUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRoundRepository: InterviewRoundRepository,
  ) {}

  async execute(jobOpeningId: string) {
    const jobOpening = await this.dataSource
      .getRepository(JobOpeningEntity)
      .createQueryBuilder('job_openings')
      .where('job_openings.id = :id', { id: jobOpeningId })
      .andWhere('job_openings.deleted_at IS NULL')
      .getOne();

    if (!jobOpening) {
      throw new NotFoundException({
        message: 'Job opening not found',
        code: 'JOB_OPENING_NOT_FOUND',
      });
    }

    return this.interviewRoundRepository.listByJobOpeningId(jobOpeningId);
  }
}
