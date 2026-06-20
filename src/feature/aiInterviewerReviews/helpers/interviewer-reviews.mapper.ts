import { InterviewerReviewResponseDto } from '../dto/interviewer-review.response.dto';
import { InterviewerReviewEntity } from '../entities/interviewer-review.entity';

function toNullableNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export class InterviewerReviewsMapper {
  static toResponse(
    entity: InterviewerReviewEntity,
  ): InterviewerReviewResponseDto {
    return {
      id: entity.id,
      ai_interview_session_id: entity.ai_interview_session_id,
      ai_interview_feedback_id: entity.ai_interview_feedback_id,
      application_id: entity.application_id,
      candidate_id: entity.candidate_id,
      reviewer_user_id: entity.reviewer_user_id,
      technical_score: toNullableNumber(entity.technical_score),
      communication_score: toNullableNumber(entity.communication_score),
      problem_solving_score: toNullableNumber(entity.problem_solving_score),
      culture_fit_score: toNullableNumber(entity.culture_fit_score),
      overall_score: toNullableNumber(entity.overall_score),
      strengths: entity.strengths,
      concerns: entity.concerns,
      detailed_review: entity.detailed_review,
      interviewer_recommendation: entity.interviewer_recommendation,
      review_status: entity.review_status,
      reviewed_at: entity.reviewed_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
      created_by_user_id: entity.created_by_user_id,
      updated_by_user_id: entity.updated_by_user_id,
      deleted_by_user_id: entity.deleted_by_user_id,
    };
  }
}
