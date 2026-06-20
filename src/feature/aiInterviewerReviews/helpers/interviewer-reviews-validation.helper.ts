import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AiInterviewFeedbackEntity } from '../../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { AiInterviewSessionStatus } from '../../aiInterviewSessions/enums/ai-interview-session-status.enum';
import { InterviewPanelMemberEntity } from '../../interviews/entities/interview-panel-member.entity';

import { InterviewerRecommendation } from '../enums/interviewer-recommendation.enum';
import { InterviewerReviewStatus } from '../enums/interviewer-review-status.enum';
import { InterviewerReviewEntity } from '../entities/interviewer-review.entity';

@Injectable()
export class InterviewerReviewsValidationHelper {
  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureSessionCompleted(status: AiInterviewSessionStatus): void {
    if (status !== AiInterviewSessionStatus.COMPLETED) {
      throw new ConflictException({
        message:
          'Interviewer review can only be created for COMPLETED AI interview sessions',
        code: 'AI_INTERVIEW_SESSION_NOT_COMPLETED',
        meta: { session_status: status },
      });
    }
  }

  ensureFeedbackBelongsToSession(
    feedback: AiInterviewFeedbackEntity,
    sessionId: string,
  ): void {
    if (feedback.ai_interview_session_id !== sessionId) {
      throw new BadRequestException({
        message:
          'AI interview feedback must belong to the same AI interview session',
        code: 'AI_INTERVIEW_FEEDBACK_SESSION_MISMATCH',
      });
    }
  }

  ensureReviewerAllowed(
    panelMembers: InterviewPanelMemberEntity[],
    reviewerUserId: string,
  ): void {
    if (!panelMembers.length) {
      return;
    }

    const isPanelMember = panelMembers.some(
      (panelMember) => panelMember.user_id === reviewerUserId,
    );

    if (!isPanelMember) {
      throw new ForbiddenException({
        message: 'Reviewer must be an assigned panel member for this interview',
        code: 'REVIEWER_NOT_ALLOWED_FOR_INTERVIEW',
      });
    }
  }

  ensureDraftEditable(review: InterviewerReviewEntity): void {
    if (review.review_status !== InterviewerReviewStatus.DRAFT) {
      throw new ConflictException({
        message: 'Only DRAFT interviewer reviews can be updated',
        code: 'INTERVIEWER_REVIEW_NOT_EDITABLE',
        meta: { review_status: review.review_status },
      });
    }
  }

  ensureSubmitAllowed(review: InterviewerReviewEntity): void {
    if (review.review_status !== InterviewerReviewStatus.DRAFT) {
      throw new ConflictException({
        message: 'Only DRAFT interviewer reviews can be submitted',
        code: 'INTERVIEWER_REVIEW_NOT_SUBMITTABLE',
        meta: { review_status: review.review_status },
      });
    }
  }

  ensureUpdateDoesNotSubmit(status?: InterviewerReviewStatus): void {
    if (status === InterviewerReviewStatus.SUBMITTED) {
      throw new ConflictException({
        message: 'Use the submit endpoint to submit an interviewer review',
        code: 'INTERVIEWER_REVIEW_USE_SUBMIT_ENDPOINT',
      });
    }
  }

  ensureSubmissionPayloadComplete(input: {
    technical_score?: number | string | null;
    communication_score?: number | string | null;
    problem_solving_score?: number | string | null;
    culture_fit_score?: number | string | null;
    detailed_review?: string | null;
    interviewer_recommendation?: InterviewerRecommendation | null;
  }): void {
    const missingFields: string[] = [];

    if (input.technical_score === null || input.technical_score === undefined) {
      missingFields.push('technical_score');
    }
    if (
      input.communication_score === null ||
      input.communication_score === undefined
    ) {
      missingFields.push('communication_score');
    }
    if (
      input.problem_solving_score === null ||
      input.problem_solving_score === undefined
    ) {
      missingFields.push('problem_solving_score');
    }
    if (
      input.culture_fit_score === null ||
      input.culture_fit_score === undefined
    ) {
      missingFields.push('culture_fit_score');
    }
    if (!this.normalizeOptionalText(input.detailed_review)) {
      missingFields.push('detailed_review');
    }
    if (!input.interviewer_recommendation) {
      missingFields.push('interviewer_recommendation');
    }

    if (missingFields.length) {
      throw new BadRequestException({
        message:
          'Submitted interviewer review requires all mandatory review fields',
        code: 'INTERVIEWER_REVIEW_SUBMISSION_FIELDS_MISSING',
        meta: { missing_fields: missingFields },
      });
    }
  }

  normalizeOptionalText(value?: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  computeOverallScore(input: {
    technical_score?: number | string | null;
    communication_score?: number | string | null;
    problem_solving_score?: number | string | null;
    culture_fit_score?: number | string | null;
  }): string | null {
    const parsedScores = [
      input.technical_score,
      input.communication_score,
      input.problem_solving_score,
      input.culture_fit_score,
    ].map((value) => {
      if (value === null || value === undefined) {
        return null;
      }

      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    });

    if (parsedScores.some((score) => score === null)) {
      return null;
    }

    const scores = parsedScores as number[];
    const total = scores.reduce((sum, score) => sum + score, 0);
    return (total / scores.length).toFixed(2);
  }
}
