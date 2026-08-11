import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuthJwtPayload } from '../../feature/auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../feature/accessControl/enums/system-role-code.enum';

@Injectable()
export class InterviewerAccessValidationHelper {
  constructor(private readonly dataSource: DataSource) {}

  isInterviewerOnly(actor?: AuthJwtPayload): boolean {
    const roles = actor?.roles ?? [];
    return (
      roles.includes(SystemRoleCode.INTERVIEWER) &&
      !roles.includes(SystemRoleCode.ADMIN) &&
      !roles.includes(SystemRoleCode.RECRUITER) &&
      !roles.includes(SystemRoleCode.HIRING_MANAGER)
    );
  }

  async assertCanAccessInterview(
    actor: AuthJwtPayload | undefined,
    interviewId: string,
  ): Promise<void> {
    if (!this.isInterviewerOnly(actor) || !actor?.sub) {
      return;
    }

    await this.assertExists(
      `SELECT 1
       FROM interview_panel_members pm
       JOIN interviews i ON i.id = pm.interview_id
       WHERE pm.interview_id = $1
         AND pm.user_id = $2
         AND pm.deleted_at IS NULL
         AND i.deleted_at IS NULL
       LIMIT 1`,
      [interviewId, actor.sub],
      'You do not have permission to access this interview',
      'INTERVIEW_ACCESS_DENIED',
    );
  }

  async assertCanAccessApplication(
    actor: AuthJwtPayload | undefined,
    applicationId: string,
  ): Promise<void> {
    if (!this.isInterviewerOnly(actor) || !actor?.sub) {
      return;
    }

    await this.assertExists(
      `SELECT 1
       FROM interviews i
       JOIN interview_panel_members pm ON pm.interview_id = i.id
       WHERE i.application_id = $1
         AND pm.user_id = $2
         AND i.deleted_at IS NULL
         AND pm.deleted_at IS NULL
       LIMIT 1`,
      [applicationId, actor.sub],
      'You do not have permission to access this application',
      'APPLICATION_ACCESS_DENIED',
    );
  }

  async assertCanAccessCandidate(
    actor: AuthJwtPayload | undefined,
    candidateId: string,
  ): Promise<void> {
    if (!this.isInterviewerOnly(actor) || !actor?.sub) {
      return;
    }

    await this.assertExists(
      `SELECT 1
       FROM applications a
       JOIN interviews i ON i.application_id = a.id
       JOIN interview_panel_members pm ON pm.interview_id = i.id
       WHERE a.candidate_id = $1
         AND pm.user_id = $2
         AND a.deleted_at IS NULL
         AND i.deleted_at IS NULL
         AND pm.deleted_at IS NULL
       LIMIT 1`,
      [candidateId, actor.sub],
      'You do not have permission to access this candidate',
      'CANDIDATE_ACCESS_DENIED',
    );
  }

  async assertCanAccessAiSession(
    actor: AuthJwtPayload | undefined,
    sessionId: string,
  ): Promise<void> {
    if (!this.isInterviewerOnly(actor) || !actor?.sub) {
      return;
    }

    await this.assertExists(
      `SELECT 1
       FROM ai_interview_sessions s
       JOIN interview_panel_members pm ON pm.interview_id = s.interview_id
       WHERE s.id = $1
         AND pm.user_id = $2
         AND s.deleted_at IS NULL
         AND pm.deleted_at IS NULL
       LIMIT 1`,
      [sessionId, actor.sub],
      'You do not have permission to access this AI interview session',
      'AI_INTERVIEW_SESSION_ACCESS_DENIED',
    );
  }

  async assertCanAccessAiQuestion(
    actor: AuthJwtPayload | undefined,
    questionId: string,
  ): Promise<void> {
    if (!this.isInterviewerOnly(actor) || !actor?.sub) {
      return;
    }

    await this.assertExists(
      `SELECT 1
       FROM ai_interview_questions q
       JOIN ai_interview_sessions s ON s.id = q.ai_interview_session_id
       JOIN interview_panel_members pm ON pm.interview_id = s.interview_id
       WHERE q.id = $1
         AND pm.user_id = $2
         AND q.deleted_at IS NULL
         AND s.deleted_at IS NULL
         AND pm.deleted_at IS NULL
       LIMIT 1`,
      [questionId, actor.sub],
      'You do not have permission to access this AI interview question',
      'AI_INTERVIEW_QUESTION_ACCESS_DENIED',
    );
  }

  async assertCanAccessAiTranscript(
    actor: AuthJwtPayload | undefined,
    transcriptId: string,
  ): Promise<void> {
    if (!this.isInterviewerOnly(actor) || !actor?.sub) {
      return;
    }

    await this.assertExists(
      `SELECT 1
       FROM ai_interview_transcripts t
       JOIN ai_interview_sessions s ON s.id = t.ai_interview_session_id
       JOIN interview_panel_members pm ON pm.interview_id = s.interview_id
       WHERE t.id = $1
         AND pm.user_id = $2
         AND t.deleted_at IS NULL
         AND s.deleted_at IS NULL
         AND pm.deleted_at IS NULL
       LIMIT 1`,
      [transcriptId, actor.sub],
      'You do not have permission to access this AI interview transcript',
      'AI_INTERVIEW_TRANSCRIPT_ACCESS_DENIED',
    );
  }

  async assertCanAccessAiFeedback(
    actor: AuthJwtPayload | undefined,
    feedbackId: string,
  ): Promise<void> {
    if (!this.isInterviewerOnly(actor) || !actor?.sub) {
      return;
    }

    await this.assertExists(
      `SELECT 1
       FROM ai_interview_feedback f
       JOIN ai_interview_sessions s ON s.id = f.ai_interview_session_id
       JOIN interview_panel_members pm ON pm.interview_id = s.interview_id
       WHERE f.id = $1
         AND pm.user_id = $2
         AND f.deleted_at IS NULL
         AND s.deleted_at IS NULL
         AND pm.deleted_at IS NULL
       LIMIT 1`,
      [feedbackId, actor.sub],
      'You do not have permission to access this AI interview feedback',
      'AI_INTERVIEW_FEEDBACK_ACCESS_DENIED',
    );
  }

  async assertCanAccessProctoringEvent(
    actor: AuthJwtPayload | undefined,
    eventId: string,
  ): Promise<void> {
    if (!this.isInterviewerOnly(actor) || !actor?.sub) {
      return;
    }

    await this.assertExists(
      `SELECT 1
       FROM interview_proctoring_events e
       JOIN ai_interview_sessions s ON s.id = e.ai_interview_session_id
       JOIN interview_panel_members pm ON pm.interview_id = s.interview_id
       WHERE e.id = $1
         AND pm.user_id = $2
         AND e.deleted_at IS NULL
         AND s.deleted_at IS NULL
         AND pm.deleted_at IS NULL
       LIMIT 1`,
      [eventId, actor.sub],
      'You do not have permission to access this proctoring event',
      'PROCTORING_EVENT_ACCESS_DENIED',
    );
  }

  async assertCanAccessInterviewerReview(
    actor: AuthJwtPayload | undefined,
    reviewId: string,
  ): Promise<void> {
    if (!this.isInterviewerOnly(actor) || !actor?.sub) {
      return;
    }

    await this.assertExists(
      `SELECT 1
       FROM interviewer_reviews r
       JOIN ai_interview_sessions s ON s.id = r.ai_interview_session_id
       JOIN interview_panel_members pm ON pm.interview_id = s.interview_id
       WHERE r.id = $1
         AND pm.user_id = $2
         AND r.deleted_at IS NULL
         AND s.deleted_at IS NULL
         AND pm.deleted_at IS NULL
       LIMIT 1`,
      [reviewId, actor.sub],
      'You do not have permission to access this interviewer review',
      'INTERVIEWER_REVIEW_ACCESS_DENIED',
    );
  }

  private async assertExists(
    query: string,
    params: unknown[],
    message: string,
    code: string,
  ): Promise<void> {
    const rows = await this.dataSource.query(query, params);
    if (!rows?.length) {
      throw new ForbiddenException({
        message,
        code,
      });
    }
  }
}
