import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateJobOpeningDto } from '../../dto/update-job-opening.dto';
import { JobOpeningEntity } from '../../entities/job-opening.entity';
import { JobOpeningRepository } from '../../repositories/job-opening.repository';
import { JobOpeningReferenceRepository } from '../../repositories/job-opening-reference.repository';
import { JobOpeningsValidationHelper } from '../../helpers/job-openings-validation.helper';

@Injectable()
export class UpdateJobOpeningUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jobOpeningRepository: JobOpeningRepository,
    private readonly referenceRepository: JobOpeningReferenceRepository,
    private readonly validationHelper: JobOpeningsValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: UpdateJobOpeningDto,
    actorUserId?: string,
  ): Promise<JobOpeningEntity> {
    return this.dataSource.transaction(async (manager) => {
      const opening = await this.jobOpeningRepository.findById(id, { manager });
      if (!opening) {
        throw new NotFoundException({
          message: 'Job opening not found',
          code: 'JOB_OPENING_NOT_FOUND',
        });
      }

      const nextExperienceMin = dto.experience_min_years ?? opening.experience_min_years;
      const nextExperienceMax = dto.experience_max_years ?? opening.experience_max_years;
      this.validationHelper.validateExperienceRange({
        min: nextExperienceMin,
        max: nextExperienceMax,
      });

      const nextMinSalary = dto.min_salary ?? (opening.min_salary !== null ? Number(opening.min_salary) : null);
      const nextMaxSalary = dto.max_salary ?? (opening.max_salary !== null ? Number(opening.max_salary) : null);
      this.validationHelper.validateSalaryRange({
        min: nextMinSalary,
        max: nextMaxSalary,
      });

      if (dto.openings_count !== undefined) {
        this.validationHelper.validateOpeningsCount(dto.openings_count);
      }

      if (dto.code !== undefined) {
        const code = this.validationHelper.normalizeCode(dto.code);
        await this.validationHelper.ensureUniqueCode({
          code,
          excludeId: opening.id,
          manager,
        });
        opening.code = code;
      }

      if (dto.title !== undefined) {
        opening.title = this.validationHelper.normalizeTitle(dto.title);
      }

      if (dto.department_id !== undefined) {
        const ok = await this.referenceRepository.departmentExists(dto.department_id, manager);
        if (!ok) {
          throw new BadRequestException({
            message: 'Department not found',
            code: 'DEPARTMENT_NOT_FOUND',
          });
        }
        opening.department_id = dto.department_id;
      }

      if (dto.hiring_manager_user_id !== undefined) {
        const ok = await this.referenceRepository.userExists(dto.hiring_manager_user_id, manager);
        if (!ok) {
          throw new BadRequestException({
            message: 'Hiring manager user not found',
            code: 'HIRING_MANAGER_NOT_FOUND',
          });
        }
        opening.hiring_manager_user_id = dto.hiring_manager_user_id;
      }

      if (dto.recruiter_user_id !== undefined) {
        const ok = await this.referenceRepository.userExists(dto.recruiter_user_id, manager);
        if (!ok) {
          throw new BadRequestException({
            message: 'Recruiter user not found',
            code: 'RECRUITER_NOT_FOUND',
          });
        }
        opening.recruiter_user_id = dto.recruiter_user_id;
      }

      if (dto.employment_type !== undefined) {
        opening.employment_type = dto.employment_type;
      }

      if (dto.work_mode !== undefined) {
        opening.work_mode = dto.work_mode;
      }

      if (dto.experience_min_years !== undefined) {
        opening.experience_min_years = dto.experience_min_years ?? null;
      }

      if (dto.experience_max_years !== undefined) {
        opening.experience_max_years = dto.experience_max_years ?? null;
      }

      if (dto.min_salary !== undefined) {
        opening.min_salary =
          dto.min_salary === null ? null : Number(dto.min_salary).toFixed(2);
      }

      if (dto.max_salary !== undefined) {
        opening.max_salary =
          dto.max_salary === null ? null : Number(dto.max_salary).toFixed(2);
      }

      if (dto.currency_code !== undefined) {
        opening.currency_code = dto.currency_code ?? null;
      }

      if (dto.openings_count !== undefined) {
        opening.openings_count = dto.openings_count;
      }

      if (dto.job_description !== undefined) {
        opening.job_description = dto.job_description ?? null;
      }

      if (dto.responsibilities !== undefined) {
        opening.responsibilities = dto.responsibilities ?? null;
      }

      if (dto.requirements !== undefined) {
        opening.requirements = dto.requirements ?? null;
      }

      if (dto.location !== undefined) {
        opening.location = dto.location ?? null;
      }

      if (dto.status !== undefined) {
        opening.status = dto.status;
      }

      if (dto.is_active !== undefined) {
        opening.is_active = dto.is_active;
      }

      if (actorUserId) {
        opening.updated_by_user_id = actorUserId;
      }

      await this.jobOpeningRepository.save(opening, { manager });

      const updated = await this.jobOpeningRepository.findById(opening.id, { manager });
      if (!updated) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'JOB_OPENING_POST_UPDATE_LOAD_FAILED',
        });
      }

      return updated;
    });
  }
}
