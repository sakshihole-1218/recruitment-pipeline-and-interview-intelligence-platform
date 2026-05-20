import { Injectable, NotFoundException } from '@nestjs/common';

import { UpdateCandidateDto } from '../../dto/update-candidate.dto';
import { CandidateEntity } from '../../entities/candidate.entity';
import { CandidatesValidationHelper } from '../../helpers/candidates-validation.helper';
import { CandidateRepository } from '../../repositories/candidate.repository';

@Injectable()
export class UpdateCandidateUseCase {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly validationHelper: CandidatesValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: UpdateCandidateDto,
    actorUserId?: string,
  ): Promise<CandidateEntity> {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) {
      throw new NotFoundException({
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND',
      });
    }

    if (dto.email !== undefined) {
      const email = this.validationHelper.normalizeEmail(dto.email);
      await this.validationHelper.ensureUniqueEmail({ email, excludeId: id });
      candidate.email = email;
    }

    if (dto.first_name !== undefined) candidate.first_name = dto.first_name;
    if (dto.last_name !== undefined) candidate.last_name = dto.last_name;

    if (dto.phone !== undefined) {
      const phone = this.validationHelper.normalizePhone(dto.phone);
      if (phone) {
        await this.validationHelper.ensureUniquePhone({ phone, excludeId: id });
      }
      candidate.phone = phone;
    }

    if (dto.date_of_birth !== undefined) candidate.date_of_birth = dto.date_of_birth ?? null;
    if (dto.gender !== undefined) candidate.gender = dto.gender ?? null;

    if (dto.total_experience_years !== undefined) {
      candidate.total_experience_years =
        dto.total_experience_years === null || dto.total_experience_years === undefined
          ? null
          : String(dto.total_experience_years);
    }

    if (dto.current_company !== undefined) candidate.current_company = dto.current_company ?? null;
    if (dto.current_job_title !== undefined) candidate.current_job_title = dto.current_job_title ?? null;
    if (dto.current_location !== undefined) candidate.current_location = dto.current_location ?? null;
    if (dto.notice_period_days !== undefined) candidate.notice_period_days = dto.notice_period_days ?? null;

    if (dto.current_salary !== undefined) {
      candidate.current_salary =
        dto.current_salary === null || dto.current_salary === undefined
          ? null
          : String(dto.current_salary);
    }

    if (dto.expected_salary !== undefined) {
      candidate.expected_salary =
        dto.expected_salary === null || dto.expected_salary === undefined
          ? null
          : String(dto.expected_salary);
    }

    if (dto.currency_code !== undefined) candidate.currency_code = dto.currency_code ?? null;
    if (dto.linkedin_url !== undefined) candidate.linkedin_url = dto.linkedin_url ?? null;
    if (dto.github_url !== undefined) candidate.github_url = dto.github_url ?? null;
    if (dto.portfolio_url !== undefined) candidate.portfolio_url = dto.portfolio_url ?? null;
    if (dto.resume_headline !== undefined) candidate.resume_headline = dto.resume_headline ?? null;
    if (dto.source_type !== undefined) candidate.source_type = dto.source_type ?? null;
    if (dto.source_details !== undefined) candidate.source_details = dto.source_details ?? null;
    if (dto.is_active !== undefined) candidate.is_active = dto.is_active;

    if (actorUserId) {
      candidate.updated_by_user_id = actorUserId;
    }

    return this.candidateRepository.save(candidate);
  }
}
