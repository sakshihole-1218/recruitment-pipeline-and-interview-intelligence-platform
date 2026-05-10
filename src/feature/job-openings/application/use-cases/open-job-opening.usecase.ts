import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { JobOpeningEntity } from '../../entities/job-opening.entity';
import { JobOpeningStatus } from '../../enums/job-opening-status.enum';
import { JobOpeningRepository } from '../../repositories/job-opening.repository';

@Injectable()
export class OpenJobOpeningUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jobOpeningRepository: JobOpeningRepository,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<JobOpeningEntity> {
    return this.dataSource.transaction(async (manager) => {
      const opening = await this.jobOpeningRepository.findById(id, { manager });
      if (!opening) {
        throw new NotFoundException({
          message: 'Job opening not found',
          code: 'JOB_OPENING_NOT_FOUND',
        });
      }

      if (!opening.published_at) {
        throw new BadRequestException({
          message: 'Job opening must be published before it can be opened',
          code: 'JOB_OPENING_NOT_PUBLISHED',
        });
      }

      if (opening.status === JobOpeningStatus.CANCELLED) {
        throw new BadRequestException({
          message: 'Cancelled job openings cannot be opened',
          code: 'JOB_OPENING_CANNOT_OPEN_CANCELLED',
        });
      }

      opening.status = JobOpeningStatus.OPEN;
      opening.closed_at = null;

      if (actorUserId) {
        opening.updated_by_user_id = actorUserId;
      }

      await this.jobOpeningRepository.save(opening, { manager });

      const updated = await this.jobOpeningRepository.findById(opening.id, { manager });
      if (!updated) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'JOB_OPENING_POST_OPEN_LOAD_FAILED',
        });
      }

      return updated;
    });
  }
}
