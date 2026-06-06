import { AiInterviewTranscriptResponseDto } from '../dto/ai-interview-transcript.response.dto';
import { AiInterviewTranscriptEntity } from '../entities/ai-interview-transcript.entity';

export class AiInterviewTranscriptsMapper {
  static toResponse(entity: AiInterviewTranscriptEntity): AiInterviewTranscriptResponseDto {
    return {
      id: entity.id,
      ai_interview_session_id: entity.ai_interview_session_id,
      ai_interview_question_id: entity.ai_interview_question_id,
      speaker_type: entity.speaker_type,
      message_text: entity.message_text,
      sequence_number: entity.sequence_number,
      spoken_at: entity.spoken_at,
      speech_to_text_confidence:
        entity.speech_to_text_confidence === null ||
        entity.speech_to_text_confidence === undefined
          ? null
          : Number(entity.speech_to_text_confidence),
      raw_payload: entity.raw_payload,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
      created_by_user_id: entity.created_by_user_id,
      updated_by_user_id: entity.updated_by_user_id,
      deleted_by_user_id: entity.deleted_by_user_id,
    };
  }
}
