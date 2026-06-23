import { Injectable } from '@nestjs/common';

import { AiInterviewFeedbackEntity } from '../../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { InterviewerReviewStatus } from '../../aiInterviewerReviews/enums/interviewer-review-status.enum';
import { InterviewerReviewEntity } from '../../aiInterviewerReviews/entities/interviewer-review.entity';
import { InterviewProctoringEventEntity } from '../../aiInterviewProctoringEvents/entities/interview-proctoring-event.entity';
import { ProctoringSeverity } from '../../aiInterviewProctoringEvents/enums/proctoring-severity.enum';
import { RiskLevel } from '../../aiInterviewProctoringEvents/enums/risk-level.enum';

@Injectable()
export class DecisionSnapshotHelper {
  buildAiRecommendationSnapshot(
    feedback?: AiInterviewFeedbackEntity | null,
  ): Record<string, unknown> | null {
    if (!feedback) {
      return null;
    }

    return {
      ai_interview_feedback_id: feedback.id,
      ai_interview_session_id: feedback.ai_interview_session_id,
      feedback_status: feedback.feedback_status,
      recommendation: feedback.recommendation,
      overall_score: feedback.overall_score,
      technical_score: feedback.technical_score,
      communication_score: feedback.communication_score,
      problem_solving_score: feedback.problem_solving_score,
      experience_relevance_score: feedback.experience_relevance_score,
      generated_at: feedback.generated_at?.toISOString() ?? null,
      strengths_summary: feedback.strengths_summary,
      weaknesses_summary: feedback.weaknesses_summary,
      detailed_feedback: feedback.detailed_feedback,
    };
  }

  buildInterviewerRecommendationSnapshot(
    reviews: InterviewerReviewEntity[],
  ): Record<string, unknown> | null {
    const submittedReviews = reviews.filter(
      (review) => review.review_status === InterviewerReviewStatus.SUBMITTED,
    );

    if (!submittedReviews.length) {
      return null;
    }

    const recommendationCounts = submittedReviews.reduce<
      Record<string, number>
    >((accumulator, review) => {
      const key = review.interviewer_recommendation ?? 'UNSPECIFIED';
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {});

    const reviewScores = submittedReviews
      .map((review) => this.toNumber(review.overall_score))
      .filter((value): value is number => value !== null);

    const averageOverallScore = reviewScores.length
      ? (
          reviewScores.reduce((sum, value) => sum + value, 0) /
          reviewScores.length
        ).toFixed(2)
      : null;

    return {
      total_reviews: submittedReviews.length,
      average_overall_score: averageOverallScore,
      recommendation_counts: recommendationCounts,
      latest_reviewed_at:
        submittedReviews
          .map((review) => review.reviewed_at?.getTime() ?? null)
          .filter((value): value is number => value !== null)
          .sort((left, right) => right - left)[0] !== undefined
          ? new Date(
              submittedReviews
                .map((review) => review.reviewed_at?.getTime() ?? null)
                .filter((value): value is number => value !== null)
                .sort((left, right) => right - left)[0],
            ).toISOString()
          : null,
      submitted_reviews: submittedReviews.map((review) => ({
        review_id: review.id,
        reviewer_user_id: review.reviewer_user_id,
        interviewer_recommendation: review.interviewer_recommendation,
        overall_score: review.overall_score,
        reviewed_at: review.reviewed_at?.toISOString() ?? null,
      })),
    };
  }

  buildProctoringRiskSnapshot(
    events: InterviewProctoringEventEntity[],
  ): Record<string, unknown> | null {
    if (!events.length) {
      return null;
    }

    const severityCounts = events.reduce<Record<string, number>>(
      (accumulator, event) => {
        accumulator[event.severity] = (accumulator[event.severity] ?? 0) + 1;
        return accumulator;
      },
      {
        [ProctoringSeverity.LOW]: 0,
        [ProctoringSeverity.MEDIUM]: 0,
        [ProctoringSeverity.HIGH]: 0,
        [ProctoringSeverity.CRITICAL]: 0,
      },
    );

    const highestSeverity = this.resolveHighestSeverity(events);
    const unresolvedEvents = events.filter(
      (event) => !event.is_resolved,
    ).length;

    return {
      total_events: events.length,
      unresolved_events: unresolvedEvents,
      highest_severity: highestSeverity,
      risk_level: this.mapSeverityToRisk(highestSeverity),
      severity_counts: severityCounts,
      critical_event_count: severityCounts[ProctoringSeverity.CRITICAL] ?? 0,
      high_or_above_event_count:
        (severityCounts[ProctoringSeverity.HIGH] ?? 0) +
        (severityCounts[ProctoringSeverity.CRITICAL] ?? 0),
      latest_event_at: events
        .map((event) => event.occurred_at.getTime())
        .sort((left, right) => right - left)
        .map((timestamp) => new Date(timestamp).toISOString())[0],
    };
  }

  private toNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private resolveHighestSeverity(
    events: InterviewProctoringEventEntity[],
  ): ProctoringSeverity {
    if (
      events.some((event) => event.severity === ProctoringSeverity.CRITICAL)
    ) {
      return ProctoringSeverity.CRITICAL;
    }

    if (events.some((event) => event.severity === ProctoringSeverity.HIGH)) {
      return ProctoringSeverity.HIGH;
    }

    if (events.some((event) => event.severity === ProctoringSeverity.MEDIUM)) {
      return ProctoringSeverity.MEDIUM;
    }

    return ProctoringSeverity.LOW;
  }

  private mapSeverityToRisk(severity: ProctoringSeverity): RiskLevel {
    switch (severity) {
      case ProctoringSeverity.CRITICAL:
        return RiskLevel.CRITICAL;
      case ProctoringSeverity.HIGH:
        return RiskLevel.HIGH;
      case ProctoringSeverity.MEDIUM:
        return RiskLevel.MEDIUM;
      case ProctoringSeverity.LOW:
      default:
        return RiskLevel.LOW;
    }
  }
}
