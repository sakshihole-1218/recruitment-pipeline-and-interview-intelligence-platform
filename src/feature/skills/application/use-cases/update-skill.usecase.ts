import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateSkillDto } from '../../dto/update-skill.dto';
import { SkillEntity } from '../../entities/skill.entity';
import { SkillRepository } from '../../repositories/skill.repository';
import { SkillsValidationHelper } from '../../helpers/skills-validation.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class UpdateSkillUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly skillRepository: SkillRepository,
    private readonly validationHelper: SkillsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    id: string,
    dto: UpdateSkillDto,
    actorUserId?: string,
  ): Promise<SkillEntity> {
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
      };

      if (dto.code !== undefined) {
        const code = this.validationHelper.normalizeCode(dto.code);
        await this.validationHelper.ensureUniqueCode({
          code,
          excludeId: skill.id,
          manager,
        });
        skill.code = code;
      }

      if (dto.name !== undefined) {
        const name = this.validationHelper.normalizeName(dto.name);
        await this.validationHelper.ensureUniqueName({
          name,
          excludeId: skill.id,
          manager,
        });
        skill.name = name;
      }

      if (dto.description !== undefined) {
        skill.description = dto.description ?? null;
      }

      if (dto.category !== undefined) {
        skill.category = dto.category;
      }

      if (dto.is_active !== undefined) {
        skill.is_active = dto.is_active;
      }

      if (actorUserId) {
        skill.updated_by_user_id = actorUserId;
      }

      await this.skillRepository.save(skill, { manager });

      const updated = await this.skillRepository.findById(skill.id, { manager });
      if (!updated) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'SKILL_POST_UPDATE_LOAD_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.SKILL,
            entityId: updated.id,
            actionType: ActivityActionType.UPDATE,
            actorUserId,
            oldValues,
            newValues: {
              name: updated.name,
              code: updated.code,
              description: updated.description,
              category: updated.category,
              is_active: updated.is_active,
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
