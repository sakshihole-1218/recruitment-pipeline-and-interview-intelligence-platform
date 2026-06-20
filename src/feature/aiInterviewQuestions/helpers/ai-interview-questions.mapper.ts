import { AiInterviewQuestionResponseDto } from '../dto/ai-interview-question.response.dto';
import { AiInterviewQuestionEntity } from '../entities/ai-interview-question.entity';

export class AiInterviewQuestionsMapper {
  static toResponse(
    entity: AiInterviewQuestionEntity,
  ): AiInterviewQuestionResponseDto {
    return {
      id: entity.id,
      ai_interview_session_id: entity.ai_interview_session_id,
      parent_question_id: entity.parent_question_id,
      question_text: entity.question_text,
      question_type: entity.question_type,
      topic: entity.topic,
      difficulty_level: entity.difficulty_level,
      sequence_number: entity.sequence_number,
      is_follow_up: entity.is_follow_up,
      generated_from: entity.generated_from,
      expected_answer_keywords: entity.expected_answer_keywords,
      asked_at: entity.asked_at,
      answered_at: entity.answered_at,
      is_answered: entity.is_answered,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
      created_by_user_id: entity.created_by_user_id,
      updated_by_user_id: entity.updated_by_user_id,
      deleted_by_user_id: entity.deleted_by_user_id,
    };
  }
}
