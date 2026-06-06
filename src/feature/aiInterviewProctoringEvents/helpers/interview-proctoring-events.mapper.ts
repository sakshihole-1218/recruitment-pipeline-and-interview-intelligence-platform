import { InterviewProctoringEventResponseDto } from '../dto/interview-proctoring-event.response.dto';
import { ProctoringRiskSummaryResponseDto } from '../dto/proctoring-risk-summary.response.dto';
import { InterviewProctoringEventEntity } from '../entities/interview-proctoring-event.entity';
import { RiskLevel } from '../enums/risk-level.enum';

export type ProctoringRiskSummaryModel = {
  ai_interview_session_id: string;
  total_events: number;
  low_count: number;
  medium_count: number;
  high_count: number;
  critical_count: number;
  risk_score: number;
  risk_level: RiskLevel;
  summary: string;
};

export class InterviewProctoringEventsMapper {
  static toResponse(
    entity: InterviewProctoringEventEntity,
  ): InterviewProctoringEventResponseDto {
    return {
      id: entity.id,
      ai_interview_session_id: entity.ai_interview_session_id,
      application_id: entity.application_id,
      candidate_id: entity.candidate_id,
      event_type: entity.event_type,
      severity: entity.severity,
      event_message: entity.event_message,
      event_metadata: entity.event_metadata,
      occurred_at: entity.occurred_at,
      duration_seconds: entity.duration_seconds,
      is_resolved: entity.is_resolved,
      resolved_at: entity.resolved_at,
      resolved_by_user_id: entity.resolved_by_user_id,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
      created_by_user_id: entity.created_by_user_id,
      updated_by_user_id: entity.updated_by_user_id,
      deleted_by_user_id: entity.deleted_by_user_id,
    };
  }

  static toRiskSummaryResponse(
    summary: ProctoringRiskSummaryModel,
  ): ProctoringRiskSummaryResponseDto {
    return {
      ai_interview_session_id: summary.ai_interview_session_id,
      total_events: summary.total_events,
      low_count: summary.low_count,
      medium_count: summary.medium_count,
      high_count: summary.high_count,
      critical_count: summary.critical_count,
      risk_score: summary.risk_score,
      risk_level: summary.risk_level,
      summary: summary.summary,
    };
  }
}
