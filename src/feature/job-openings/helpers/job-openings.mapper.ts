import { JobOpeningResponseDto } from '../dto/job-opening.response.dto';
import { JobOpeningSkillResponseDto } from '../dto/job-opening-skill.response.dto';
import { JobOpeningEntity } from '../entities/job-opening.entity';
import { JobOpeningSkillEntity } from '../entities/job-opening-skill.entity';

export class JobOpeningsMapper {
  static toSkillResponse(
    entity: JobOpeningSkillEntity,
  ): JobOpeningSkillResponseDto {
    return {
      id: entity.id,
      skill_id: entity.skill_id,
      proficiency_level: entity.proficiency_level,
      is_mandatory: entity.is_mandatory,
      years_of_experience_required: entity.years_of_experience_required,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      skill_name: entity.skill?.name,
      skill_code: entity.skill?.code,
      skill_category: entity.skill?.category,
    };
  }

  static toResponse(entity: JobOpeningEntity): JobOpeningResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      code: entity.code,
      department_id: entity.department_id,
      department_name: entity.department?.name ?? null,
      hiring_manager_user_id: entity.hiring_manager_user_id,
      recruiter_user_id: entity.recruiter_user_id,
      employment_type: entity.employment_type,
      work_mode: entity.work_mode,
      experience_min_years: entity.experience_min_years,
      experience_max_years: entity.experience_max_years,
      min_salary: entity.min_salary,
      max_salary: entity.max_salary,
      currency_code: entity.currency_code,
      openings_count: entity.openings_count,
      job_description: entity.job_description,
      responsibilities: entity.responsibilities,
      requirements: entity.requirements,
      location: entity.location,
      status: entity.status,
      published_at: entity.published_at,
      closed_at: entity.closed_at,
      is_active: entity.is_active,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      skills: entity.job_opening_skills
        ? entity.job_opening_skills
            .filter((s) => !s.deleted_at)
            .map(JobOpeningsMapper.toSkillResponse)
        : undefined,
    };
  }
}
