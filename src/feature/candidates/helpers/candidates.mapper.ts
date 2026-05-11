import { CandidateEntity } from '../entities/candidate.entity';
import { CandidateResponseDto } from '../dto/candidate.response.dto';
import { CandidateSkillEntity } from '../entities/candidate-skill.entity';
import { CandidateSkillResponseDto } from '../dto/candidate-skill.response.dto';
import { CandidateDocumentEntity } from '../entities/candidate-document.entity';
import { CandidateDocumentResponseDto } from '../dto/candidate-document.response.dto';

export class CandidatesMapper {
  static toCandidateResponse(entity: CandidateEntity): CandidateResponseDto {
    return {
      id: entity.id,
      first_name: entity.first_name,
      last_name: entity.last_name,
      email: entity.email,
      phone: entity.phone,
      date_of_birth: entity.date_of_birth,
      gender: entity.gender,
      total_experience_years: entity.total_experience_years,
      current_company: entity.current_company,
      current_job_title: entity.current_job_title,
      current_location: entity.current_location,
      notice_period_days: entity.notice_period_days,
      current_salary: entity.current_salary,
      expected_salary: entity.expected_salary,
      currency_code: entity.currency_code,
      linkedin_url: entity.linkedin_url,
      github_url: entity.github_url,
      portfolio_url: entity.portfolio_url,
      resume_headline: entity.resume_headline,
      source_type: entity.source_type,
      source_details: entity.source_details,
      is_active: entity.is_active,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  static toSkillResponse(entity: CandidateSkillEntity): CandidateSkillResponseDto {
    return {
      id: entity.id,
      candidate_id: entity.candidate_id,
      skill_id: entity.skill_id,
      years_of_experience: entity.years_of_experience,
      proficiency_level: entity.proficiency_level,
      is_primary: entity.is_primary,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      skill_name: entity.skill?.name ?? null,
      skill_code: entity.skill?.code ?? null,
    };
  }

  static toDocumentResponse(entity: CandidateDocumentEntity): CandidateDocumentResponseDto {
    return {
      id: entity.id,
      candidate_id: entity.candidate_id,
      document_type: entity.document_type,
      file_name: entity.file_name,
      file_url: entity.file_url,
      file_size: entity.file_size,
      mime_type: entity.mime_type,
      uploaded_at: entity.uploaded_at,
      is_latest: entity.is_latest,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
