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
      decided_by_user_id: entity.decided_by_user_id,
      decision_at: entity.decision_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
