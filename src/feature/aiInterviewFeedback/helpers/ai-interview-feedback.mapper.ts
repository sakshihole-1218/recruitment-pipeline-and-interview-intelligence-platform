import { AiInterviewFeedbackResponseDto } from '../dto/ai-interview-feedback.response.dto';
import { AiInterviewFeedbackEntity } from '../entities/ai-interview-feedback.entity';

function toNullableNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export class AiInterviewFeedbackMapper {
  static toResponse(
    entity: AiInterviewFeedbackEntity,
  ): AiInterviewFeedbackResponseDto {
    return {
      id: entity.id,
      ai_interview_session_id: entity.ai_interview_session_id,
      application_id: entity.application_id,
      candidate_id: entity.candidate_id,
      resume_analysis_id: entity.resume_analysis_id,
      technical_score: toNullableNumber(entity.technical_score),
      communication_score: toNullableNumber(entity.communication_score),
      problem_solving_score: toNullableNumber(entity.problem_solving_score),
      experience_relevance_score: toNullableNumber(
        entity.experience_relevance_score,
      ),
      overall_score: toNullableNumber(entity.overall_score),
      strengths_summary: entity.strengths_summary,
      weaknesses_summary: entity.weaknesses_summary,
      detailed_feedback: entity.detailed_feedback,
      technical_summary: entity.technical_summary,
      communication_summary: entity.communication_summary,
      problem_solving_summary: entity.problem_solving_summary,
      experience_relevance_summary: entity.experience_relevance_summary,
      recommendation: entity.recommendation,
      feedback_status: entity.feedback_status,
      generated_at: entity.generated_at,
      failure_reason: entity.failure_reason,
      evaluation_metadata: entity.evaluation_metadata,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
      created_by_user_id: entity.created_by_user_id,
      updated_by_user_id: entity.updated_by_user_id,
      deleted_by_user_id: entity.deleted_by_user_id,
    };
  }
}
