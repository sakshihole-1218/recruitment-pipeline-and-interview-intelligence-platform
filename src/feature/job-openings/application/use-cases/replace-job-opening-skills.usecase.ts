import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { JobOpeningEntity } from '../../entities/job-opening.entity';
import { JobOpeningRepository } from '../../repositories/job-opening.repository';
import { JobOpeningSkillRepository } from '../../repositories/job-opening-skill.repository';
import { JobOpeningReferenceRepository } from '../../repositories/job-opening-reference.repository';
import { JobOpeningsValidationHelper } from '../../helpers/job-openings-validation.helper';
import { JobOpeningSkillInputDto } from '../../dto/job-opening-skill.input.dto';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class ReplaceJobOpeningSkillsUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jobOpeningRepository: JobOpeningRepository,
    private readonly jobOpeningSkillRepository: JobOpeningSkillRepository,
    private readonly referenceRepository: JobOpeningReferenceRepository,
    private readonly validationHelper: JobOpeningsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    jobOpeningId: string,
    skillsInput: JobOpeningSkillInputDto[],
    actorUserId?: string,
  ): Promise<JobOpeningEntity> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const opening = await this.jobOpeningRepository.findById(jobOpeningId, {
        manager,
      });

      if (!opening) {
        throw new NotFoundException({
          message: 'Job opening not found',
          code: 'JOB_OPENING_NOT_FOUND',
        });
      }

      const normalizedSkills =
        this.validationHelper.dedupeAndValidateSkills(skillsInput);
      const skillIds = normalizedSkills.map((s) => s.skill_id);
      const skills = await this.referenceRepository.findSkillsByIds(
        skillIds,
        manager,
      );

      if (skills.length !== skillIds.length) {
        throw new BadRequestException({
          message: 'One or more skills are invalid',
          code: 'INVALID_SKILL_ID',
        });
      }

      await this.jobOpeningSkillRepository.replaceSkills({
        jobOpeningId,
        skills: normalizedSkills.map((s) => ({
          skill_id: s.skill_id,
          proficiency_level: s.proficiency_level,
          is_mandatory: s.is_mandatory ?? true,
          years_of_experience_required: s.years_of_experience_required ?? null,
        })),
        manager,
      });

      if (actorUserId) {
        await manager
          .getRepository(JobOpeningEntity)
          .createQueryBuilder()
          .update(JobOpeningEntity)
          .set({
            updated_by_user_id: actorUserId,
            updated_at: () => 'CURRENT_TIMESTAMP',
          })
          .where('id = :id', { id: opening.id })
          .execute();
      }

      const updated = await this.jobOpeningRepository.findById(jobOpeningId, {
        manager,
      });
      if (!updated) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'JOB_OPENING_POST_SKILLS_UPDATE_LOAD_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.JOB_OPENING,
            entityId: updated.id,
            actionType: ActivityActionType.UPDATE,
            actorUserId,
            oldValues: { changed_fields: ['skills'] },
            newValues: { changed_fields: ['skills'] },
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
