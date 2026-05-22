import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateSkillDto } from '../../dto/create-skill.dto';
import { SkillEntity } from '../../entities/skill.entity';
import { SkillRepository } from '../../repositories/skill.repository';
import { SkillsValidationHelper } from '../../helpers/skills-validation.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CreateSkillUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly skillRepository: SkillRepository,
    private readonly validationHelper: SkillsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(dto: CreateSkillDto, actorUserId?: string): Promise<SkillEntity> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const code = this.validationHelper.normalizeCode(dto.code);
      const name = this.validationHelper.normalizeName(dto.name);

      const existingByCode = await this.skillRepository.findByCode(code, {
        includeDeleted: true,
        manager,
      });

      
      if (existingByCode) {
        if (!existingByCode.deleted_at) {
          throw new ConflictException({
            message: 'A skill with this code already exists',
            code: 'SKILL_CODE_ALREADY_EXISTS',
          });
        }

        await this.validationHelper.ensureUniqueName({
          name,
          excludeId: existingByCode.id,
          manager,
        });

        const oldValues = {
          name: existingByCode.name,
          code: existingByCode.code,
          description: existingByCode.description,
          category: existingByCode.category,
          is_active: existingByCode.is_active,
          deleted_at: existingByCode.deleted_at ? existingByCode.deleted_at.toISOString() : null,
        };

        existingByCode.name = name;
        existingByCode.description = dto.description ?? null;
        existingByCode.category = dto.category;
        existingByCode.is_active = dto.is_active ?? true;
        existingByCode.deleted_at = null;
        existingByCode.deleted_by_user_id = null;
        existingByCode.updated_by_user_id = actorUserId ?? existingByCode.updated_by_user_id;

        await this.skillRepository.save(existingByCode, { manager });

        const restored = await this.skillRepository.findById(existingByCode.id, {
          manager,
        });
        if (!restored) {
          throw new ConflictException({
            message: 'We could not complete the request. Please try again',
            code: 'SKILL_POST_CREATE_LOAD_FAILED',
          });
        }

        if (actorUserId) {
          await this.activityWriter.log(
            ActivityLogBuilder.build({
              entityType: ActivityEntityType.SKILL,
              entityId: restored.id,
              actionType: ActivityActionType.UPDATE,
              actorUserId,
              oldValues,
              newValues: {
                name: restored.name,
                code: restored.code,
                description: restored.description,
                category: restored.category,
                is_active: restored.is_active,
                deleted_at: null,
              },
              actionAt: now,
              ipAddress: null,
              userAgent: null,
            }),
            { manager },
          );
        }

        return restored;
      }

      await this.validationHelper.ensureUniqueName({ name, manager });

      const created = await this.skillRepository.createAndSave(
        {
          name,
          code,
          description: dto.description ?? null,
          category: dto.category,
          is_active: dto.is_active ?? true,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const loaded = await this.skillRepository.findById(created.id, { manager });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'SKILL_POST_CREATE_LOAD_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.SKILL,
            entityId: loaded.id,
            actionType: ActivityActionType.CREATE,
            actorUserId,
            oldValues: null,
            newValues: {
              name: loaded.name,
              code: loaded.code,
              description: loaded.description,
              category: loaded.category,
              is_active: loaded.is_active,
            },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      return loaded;
    });
  }
}
