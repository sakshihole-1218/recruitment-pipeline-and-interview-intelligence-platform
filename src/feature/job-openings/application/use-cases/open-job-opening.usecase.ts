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
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class OpenJobOpeningUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jobOpeningRepository: JobOpeningRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<JobOpeningEntity> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
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

      const oldValues = {
        status: opening.status,
        closed_at: opening.closed_at ? opening.closed_at.toISOString() : null,
      };

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

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.JOB_OPENING,
            entityId: updated.id,
            actionType: ActivityActionType.STATUS_CHANGE,
            actorUserId,
            oldValues,
            newValues: {
              status: updated.status,
              closed_at: null,
            },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      return updated;
    });
  }
}
