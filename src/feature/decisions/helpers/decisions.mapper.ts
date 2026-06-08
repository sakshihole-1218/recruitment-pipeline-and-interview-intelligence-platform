import { ApplicationDecisionEntity } from '../entities/application-decision.entity';
import { ApplicationDecisionResponseDto } from '../dto/application-decision.response.dto';

export class DecisionsMapper {
  static toDecisionResponse(
    entity: ApplicationDecisionEntity,
  ): ApplicationDecisionResponseDto {
    return {
      id: entity.id,
      application_id: entity.application_id,
      decision_status: entity.decision_status,
      decision_reason: entity.decision_reason,
      decision_notes: entity.decision_notes,
      decided_by_user_id: entity.decided_by_user_id,
      ai_interview_session_id: entity.ai_interview_session_id,
      ai_interview_feedback_id: entity.ai_interview_feedback_id,
      decision_source: entity.decision_source,
      final_score: entity.final_score,
      ai_recommendation_snapshot: entity.ai_recommendation_snapshot,
      interviewer_recommendation_snapshot:
        entity.interviewer_recommendation_snapshot,
      proctoring_risk_snapshot: entity.proctoring_risk_snapshot,
      decision_at: entity.decision_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
