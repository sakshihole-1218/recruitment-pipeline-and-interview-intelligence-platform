import { AiInterviewSessionEntity } from '../entities/ai-interview-session.entity';
import { AiInterviewSessionResponseDto } from '../dto/ai-interview-session.response.dto';

export class AiInterviewSessionsMapper {
  static toResponse(entity: AiInterviewSessionEntity): AiInterviewSessionResponseDto {
    return {
      id: entity.id,
      interview_id: entity.interview_id,
      application_id: entity.application_id,
      candidate_id: entity.candidate_id,
      resume_analysis_id: entity.resume_analysis_id,
      session_code: entity.session_code,
      session_status: entity.session_status,
      livekit_room_name: entity.livekit_room_name,
      question_generation_status: entity.question_generation_status,
      feedback_generation_status: entity.feedback_generation_status,
      started_at: entity.started_at,
      ended_at: entity.ended_at,
      duration_seconds: entity.duration_seconds,
      failure_reason: entity.failure_reason,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
      created_by_user_id: entity.created_by_user_id,
      updated_by_user_id: entity.updated_by_user_id,
      deleted_by_user_id: entity.deleted_by_user_id,
    };
  }
}
