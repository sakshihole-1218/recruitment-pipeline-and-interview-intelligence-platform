import { Injectable, NotFoundException } from '@nestjs/common';

import { JobOpeningEntity } from '../../entities/job-opening.entity';
import { JobOpeningRepository } from '../../repositories/job-opening.repository';

@Injectable()
export class FindJobOpeningByIdUseCase {
  constructor(private readonly jobOpeningRepository: JobOpeningRepository) {}

  async execute(id: string): Promise<JobOpeningEntity> {
    const opening = await this.jobOpeningRepository.findById(id);
    if (!opening) {
      throw new NotFoundException({
        message: 'Job opening not found',
        code: 'JOB_OPENING_NOT_FOUND',
      });
    }
    return opening;
  }
}
