import { LivekitRoomSessionEntity } from '../entities/livekit-room-session.entity';
import { LivekitRoomSessionResponseDto } from '../dto/livekit-room-session.response.dto';

export class LivekitRoomSessionsMapper {
  static toResponse(entity: LivekitRoomSessionEntity): LivekitRoomSessionResponseDto {
    return {
      id: entity.id,
      ai_interview_session_id: entity.ai_interview_session_id,
      interview_id: entity.interview_id,
      application_id: entity.application_id,
      candidate_id: entity.candidate_id,
      room_name: entity.room_name,
      room_status: entity.room_status,
      candidate_identity: entity.candidate_identity,
      ai_agent_identity: entity.ai_agent_identity,
      room_started_at: entity.room_started_at,
      room_ended_at: entity.room_ended_at,
      last_webhook_event_at: entity.last_webhook_event_at,
      metadata: entity.metadata,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
      created_by_user_id: entity.created_by_user_id,
      updated_by_user_id: entity.updated_by_user_id,
      deleted_by_user_id: entity.deleted_by_user_id,
    };
  }
}
