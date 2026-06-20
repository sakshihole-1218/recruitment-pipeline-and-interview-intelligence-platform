import { InterviewFeedbackResponseDto } from '../dto/interview-feedback.response.dto';
import { InterviewPanelMemberResponseDto } from '../dto/interview-panel-member.response.dto';
import { InterviewResponseDto } from '../dto/interview.response.dto';
import { InterviewRoundResponseDto } from '../dto/interview-round.response.dto';
import { InterviewFeedbackEntity } from '../entities/interview-feedback.entity';
import { InterviewPanelMemberEntity } from '../entities/interview-panel-member.entity';
import { InterviewEntity } from '../entities/interview.entity';
import { InterviewRoundEntity } from '../entities/interview-round.entity';

export class InterviewsMapper {
  static toInterviewRoundResponse(
    entity: InterviewRoundEntity,
  ): InterviewRoundResponseDto {
    return {
      id: entity.id,
      job_opening_id: entity.job_opening_id,
      round_name: entity.round_name,
      round_type: entity.round_type,
      sequence_number: entity.sequence_number,
      is_mandatory: entity.is_mandatory,
      max_score: entity.max_score,
      description: entity.description,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  static toPanelMemberResponse(
    entity: InterviewPanelMemberEntity,
  ): InterviewPanelMemberResponseDto {
    return {
      id: entity.id,
      interview_id: entity.interview_id,
      user_id: entity.user_id,
      role_in_panel: entity.role_in_panel,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  static toInterviewResponse(entity: InterviewEntity): InterviewResponseDto {
    return {
      id: entity.id,
      application_id: entity.application_id,
      interview_round_id: entity.interview_round_id,
      scheduled_start_at: entity.scheduled_start_at,
      scheduled_end_at: entity.scheduled_end_at,
      interview_mode: entity.interview_mode,
      meeting_link: entity.meeting_link,
      location_details: entity.location_details,
      interview_status: entity.interview_status,
      scheduled_by_user_id: entity.scheduled_by_user_id,
      rescheduled_from_interview_id: entity.rescheduled_from_interview_id,
      reschedule_reason: entity.reschedule_reason,
      cancel_reason: entity.cancel_reason,
      completed_at: entity.completed_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      panel_members: Array.isArray(entity.panel_members)
        ? entity.panel_members
            .filter((m) => !m.deleted_at)
            .map(InterviewsMapper.toPanelMemberResponse)
        : undefined,
    };
  }

  static toFeedbackResponse(
    entity: InterviewFeedbackEntity,
  ): InterviewFeedbackResponseDto {
    return {
      id: entity.id,
      interview_id: entity.interview_id,
      interviewer_user_id: entity.interviewer_user_id,
      technical_score: entity.technical_score,
      communication_score: entity.communication_score,
      problem_solving_score: entity.problem_solving_score,
      culture_fit_score: entity.culture_fit_score,
      overall_score: entity.overall_score,
      strengths: entity.strengths,
      concerns: entity.concerns,
      detailed_feedback: entity.detailed_feedback,
      recommendation: entity.recommendation,
      submitted_at: entity.submitted_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
