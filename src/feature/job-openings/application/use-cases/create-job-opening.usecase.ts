import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateJobOpeningDto } from '../../dto/create-job-opening.dto';
import { JobOpeningEntity } from '../../entities/job-opening.entity';
import { JobOpeningStatus } from '../../enums/job-opening-status.enum';
import { JobOpeningRepository } from '../../repositories/job-opening.repository';
import { JobOpeningSkillRepository } from '../../repositories/job-opening-skill.repository';
import { JobOpeningReferenceRepository } from '../../repositories/job-opening-reference.repository';
import { JobOpeningsValidationHelper } from '../../helpers/job-openings-validation.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CreateJobOpeningUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jobOpeningRepository: JobOpeningRepository,
    private readonly jobOpeningSkillRepository: JobOpeningSkillRepository,
    private readonly referenceRepository: JobOpeningReferenceRepository,
    private readonly validationHelper: JobOpeningsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(dto: CreateJobOpeningDto, actorUserId?: string): Promise<JobOpeningEntity> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const code = this.validationHelper.normalizeCode(dto.code);
      const title = this.validationHelper.normalizeTitle(dto.title);

      await this.validationHelper.ensureUniqueCode({ code, manager });
      this.validationHelper.validateOpeningsCount(dto.openings_count);
      this.validationHelper.validateExperienceRange({
        min: dto.experience_min_years,
        max: dto.experience_max_years,
      });
      this.validationHelper.validateSalaryRange({
        min: dto.min_salary,
        max: dto.max_salary,
      });

      const departmentOk = await this.referenceRepository.departmentExists(
        dto.department_id,
        manager,
      );
      if (!departmentOk) {
        throw new BadRequestException({
          message: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND',
        });
      }

      const hmOk = await this.referenceRepository.userExists(
        dto.hiring_manager_user_id,
        manager,
      );
      if (!hmOk) {
        throw new BadRequestException({
          message: 'Hiring manager user not found',
          code: 'HIRING_MANAGER_NOT_FOUND',
        });
      }

      const recruiterOk = await this.referenceRepository.userExists(
        dto.recruiter_user_id,
        manager,
      );
      if (!recruiterOk) {
        throw new BadRequestException({
          message: 'Recruiter user not found',
          code: 'RECRUITER_NOT_FOUND',
        });
      }

      const status = dto.status ?? JobOpeningStatus.DRAFT;

      const created = await this.jobOpeningRepository.createAndSave(
        {
          title,
          code,
          department_id: dto.department_id,
          hiring_manager_user_id: dto.hiring_manager_user_id,
          recruiter_user_id: dto.recruiter_user_id,
          employment_type: dto.employment_type,
          work_mode: dto.work_mode,
          experience_min_years: dto.experience_min_years ?? null,
          experience_max_years: dto.experience_max_years ?? null,
          min_salary:
            dto.min_salary === undefined || dto.min_salary === null
              ? null
              : Number(dto.min_salary).toFixed(2),
          max_salary:
            dto.max_salary === undefined || dto.max_salary === null
              ? null
              : Number(dto.max_salary).toFixed(2),
          currency_code: dto.currency_code ?? null,
          openings_count: dto.openings_count,
          job_description: dto.job_description ?? null,
          responsibilities: dto.responsibilities ?? null,
          requirements: dto.requirements ?? null,
          location: dto.location ?? null,
          status,
          published_at: null,
          closed_at: null,
          is_active: dto.is_active ?? true,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const normalizedSkills = this.validationHelper.dedupeAndValidateSkills(
        dto.skills,
      );
      if (normalizedSkills.length) {
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
          jobOpeningId: created.id,
          skills: normalizedSkills.map((s) => ({
            skill_id: s.skill_id,
            proficiency_level: s.proficiency_level,
            is_mandatory: s.is_mandatory ?? true,
            years_of_experience_required:
              s.years_of_experience_required ?? null,
          })),
          manager,
        });
      }

      const loaded = await this.jobOpeningRepository.findById(created.id, {
        manager,
      });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'JOB_OPENING_POST_CREATE_LOAD_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.JOB_OPENING,
            entityId: loaded.id,
            actionType: ActivityActionType.CREATE,
            actorUserId,
            oldValues: null,
            newValues: {
              code: loaded.code,
              title: loaded.title,
              status: loaded.status,
              is_active: loaded.is_active,
              department_id: loaded.department_id,
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
