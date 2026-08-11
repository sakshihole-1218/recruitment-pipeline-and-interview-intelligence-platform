import { AiInterviewSessionsMapper } from '../../aiInterviewSessions/helpers/ai-interview-sessions.mapper';
import { CandidateInterviewInviteEntity } from '../entities/candidate-interview-invite.entity';
import { CandidateInterviewAccessResponseDto } from '../dto/candidate-interview-access.response.dto';
import { CandidateInterviewInviteResponseDto } from '../dto/candidate-interview-invite.response.dto';

export class CandidateInterviewInvitesMapper {
  static buildJoinUrl(token: string): string {
    return `/interview/join/${token}`;
  }

  static toResponse(
    entity: CandidateInterviewInviteEntity,
    extras?: { join_url?: string; raw_token?: string },
  ): CandidateInterviewInviteResponseDto {
    return {
      id: entity.id,
      interview_id: entity.interview_id,
      ai_interview_session_id: entity.ai_interview_session_id,
      candidate_id: entity.candidate_id,
      status: entity.status,
      valid_from: entity.valid_from,
      expires_at: entity.expires_at,
      first_accessed_at: entity.first_accessed_at,
      last_accessed_at: entity.last_accessed_at,
      completed_at: entity.completed_at,
      revoked_at: entity.revoked_at,
      join_url:
        extras?.join_url ??
        (entity.public_token
          ? CandidateInterviewInvitesMapper.buildJoinUrl(entity.public_token)
          : undefined),
      raw_token: extras?.raw_token,
      public_token: entity.public_token,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  static toAccessResponse(entity: CandidateInterviewInviteEntity): CandidateInterviewAccessResponseDto {
    const candidateName = [
      entity.candidate?.first_name,
      entity.candidate?.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const scheduledStartAt = entity.interview?.scheduled_start_at ?? entity.valid_from ?? entity.expires_at;
    const scheduledEndAt = entity.interview?.scheduled_end_at ?? entity.expires_at;
    const estimatedDurationMinutes = Math.max(
      1,
      Math.round(
        (scheduledEndAt.getTime() - scheduledStartAt.getTime()) / 60000,
      ),
    );

    return {
      invite_id: entity.id,
      invite_status: entity.status,
      interview_id: entity.interview_id,
      scheduled_start_at: scheduledStartAt,
      scheduled_end_at: scheduledEndAt,
      estimated_duration_minutes: estimatedDurationMinutes,
      valid_from: entity.valid_from,
      expires_at: entity.expires_at,
      first_accessed_at: entity.first_accessed_at,
      last_accessed_at: entity.last_accessed_at,
      completed_at: entity.completed_at,
      candidate: {
        full_name: candidateName || 'Candidate',
      },
      job_opening: {
        title: entity.interview?.application?.job_opening?.title ?? 'Interview',
        code: entity.interview?.application?.job_opening?.code ?? '-',
      },
      interview_round: {
        round_name: entity.interview?.interview_round?.round_name ?? 'Interview Round',
      },
      ai_interview_session: AiInterviewSessionsMapper.toResponse(
        entity.ai_interview_session!,
      ),
      instructions: [
        'Keep your camera enabled throughout the interview.',
        'Keep your microphone enabled and answer naturally.',
        'Sit in a quiet environment and avoid switching browser tabs.',
        'The AI interviewer may ask follow-up questions automatically.',
      ],
    };
  }
}
