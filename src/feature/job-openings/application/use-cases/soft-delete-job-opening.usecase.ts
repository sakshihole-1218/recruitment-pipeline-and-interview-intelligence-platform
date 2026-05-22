import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { JobOpeningRepository } from '../../repositories/job-opening.repository';
import { JobOpeningSkillRepository } from '../../repositories/job-opening-skill.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class SoftDeleteJobOpeningUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jobOpeningRepository: JobOpeningRepository,
    private readonly jobOpeningSkillRepository: JobOpeningSkillRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const opening = await this.jobOpeningRepository.findById(id, { manager });
      if (!opening) {
        throw new NotFoundException({
          message: 'Job opening not found',
          code: 'JOB_OPENING_NOT_FOUND',
        });
      }

      opening.deleted_at = now;
      opening.deleted_by_user_id = actorUserId ?? null;
      opening.updated_by_user_id = actorUserId ?? opening.updated_by_user_id;

      await this.jobOpeningRepository.save(opening, { manager });
      await this.jobOpeningSkillRepository.softDeleteByJobOpeningId(id, { manager });

      const loaded = await this.jobOpeningRepository.findById(id, { manager });
      if (loaded) {
        throw new ConflictException({
          message: 'We could not delete the job opening. Please try again',
          code: 'JOB_OPENING_SOFT_DELETE_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.JOB_OPENING,
            entityId: opening.id,
            actionType: ActivityActionType.DELETE,
            actorUserId,
            oldValues: { deleted_at: null },
            newValues: { deleted_at: now.toISOString() },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }
    });
  }
}
