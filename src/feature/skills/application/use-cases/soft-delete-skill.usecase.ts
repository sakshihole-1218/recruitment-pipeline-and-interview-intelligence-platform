import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { SkillRepository } from '../../repositories/skill.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class SoftDeleteSkillUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly skillRepository: SkillRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const skill = await this.skillRepository.findById(id, { manager });

      if (!skill) {
        throw new NotFoundException({
          message: 'Skill not found',
          code: 'SKILL_NOT_FOUND',
        });
      }

      const oldValues = {
        name: skill.name,
        code: skill.code,
        description: skill.description,
        category: skill.category,
        is_active: skill.is_active,
        deleted_at: null,
      };

      skill.deleted_at = new Date();
      skill.deleted_by_user_id = actorUserId ?? null;
      skill.updated_by_user_id = actorUserId ?? skill.updated_by_user_id;

      await this.skillRepository.save(skill, { manager });

      const loaded = await this.skillRepository.findById(id, { manager });
      if (loaded) {
        throw new ConflictException({
          message: 'We could not delete the skill. Please try again',
          code: 'SKILL_SOFT_DELETE_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.SKILL,
            entityId: skill.id,
            actionType: ActivityActionType.DELETE,
            actorUserId,
            oldValues,
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
