import { Injectable } from '@nestjs/common';

import { CreateCandidateDto } from '../../dto/create-candidate.dto';
import { CandidateEntity } from '../../entities/candidate.entity';
import { CandidatesValidationHelper } from '../../helpers/candidates-validation.helper';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CreateCandidateUseCase {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly validationHelper: CandidatesValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(dto: CreateCandidateDto, actorUserId?: string): Promise<CandidateEntity> {
    const email = this.validationHelper.normalizeEmail(dto.email);
    await this.validationHelper.ensureUniqueEmail({ email });

    const phone = dto.phone !== undefined ? this.validationHelper.normalizePhone(dto.phone) : null;
    if (phone) {
      await this.validationHelper.ensureUniquePhone({ phone });
    }

    const created = await this.candidateRepository.createAndSave({
      first_name: dto.first_name,
      last_name: dto.last_name,
      email,
      phone,
      date_of_birth: dto.date_of_birth ?? null,
      gender: dto.gender ?? null,
      total_experience_years:
        dto.total_experience_years === undefined || dto.total_experience_years === null
          ? null
          : String(dto.total_experience_years),
      current_company: dto.current_company ?? null,
      current_job_title: dto.current_job_title ?? null,
      current_location: dto.current_location ?? null,
      notice_period_days: dto.notice_period_days ?? null,
      current_salary:
        dto.current_salary === undefined || dto.current_salary === null
          ? null
          : String(dto.current_salary),
      expected_salary:
        dto.expected_salary === undefined || dto.expected_salary === null
          ? null
          : String(dto.expected_salary),
      currency_code: dto.currency_code ?? null,
      linkedin_url: dto.linkedin_url ?? null,
      github_url: dto.github_url ?? null,
      portfolio_url: dto.portfolio_url ?? null,
      resume_headline: dto.resume_headline ?? null,
      source_type: dto.source_type ?? null,
      source_details: dto.source_details ?? null,
      is_active: dto.is_active ?? true,
      created_by_user_id: actorUserId ?? null,
      updated_by_user_id: actorUserId ?? null,
    });

    if (actorUserId) {
      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.CANDIDATE,
          entityId: created.id,
          actionType: ActivityActionType.CREATE,
          actorUserId,
          oldValues: null,
          newValues: { is_active: created.is_active },
          ipAddress: null,
          userAgent: null,
        }),
      );
    }

    return created;
  }
}
