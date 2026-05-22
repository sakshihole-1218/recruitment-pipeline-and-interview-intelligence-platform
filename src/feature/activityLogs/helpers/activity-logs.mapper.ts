import { ActivityLogResponseDto } from '../dto/activity-log.response.dto';
import { ActivityLogEntity } from '../entities/activity-log.entity';

export class ActivityLogsMapper {
  static toResponse(entity: ActivityLogEntity): ActivityLogResponseDto {
    return {
      id: entity.id,
      entity_type: entity.entity_type,
      entity_id: entity.entity_id,
      action_type: entity.action_type,
      old_values: entity.old_values,
      new_values: entity.new_values,
      action_by_user_id: entity.action_by_user_id,
      action_at: entity.action_at,
      ip_address: entity.ip_address,
      user_agent: entity.user_agent,
      created_at: entity.created_at,
    };
  }
}
