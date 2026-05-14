import { ApplicationEntity } from '../entities/application.entity';
import { ApplicationStageHistoryEntity } from '../entities/application-stage-history.entity';
import { ApplicationResponseDto } from '../dto/application.response.dto';
import { ApplicationStageHistoryResponseDto } from '../dto/application-stage-history.response.dto';

export class ApplicationsMapper {
  static toApplicationResponse(entity: ApplicationEntity): ApplicationResponseDto {
    return {
      id: entity.id,
      application_number: entity.application_number,
      candidate_id: entity.candidate_id,
      job_opening_id: entity.job_opening_id,
      applied_at: entity.applied_at,
      current_stage: entity.current_stage,
      application_status: entity.application_status,
      screening_score: entity.screening_score,
      fit_score: entity.fit_score,
      assigned_recruiter_user_id: entity.assigned_recruiter_user_id,
      assigned_hiring_manager_user_id: entity.assigned_hiring_manager_user_id,
      is_priority: entity.is_priority,
      rejection_reason: entity.rejection_reason,
      withdrawal_reason: entity.withdrawal_reason,
      last_stage_changed_at: entity.last_stage_changed_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  static toStageHistoryResponse(
    entity: ApplicationStageHistoryEntity,
  ): ApplicationStageHistoryResponseDto {
    return {
      id: entity.id,
      application_id: entity.application_id,
      from_stage: entity.from_stage,
      to_stage: entity.to_stage,
      changed_by_user_id: entity.changed_by_user_id,
      change_reason: entity.change_reason,
      changed_at: entity.changed_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
