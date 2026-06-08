import { Injectable } from '@nestjs/common';

import { AiInterviewFeedbackEntity } from '../../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { InterviewerReviewStatus } from '../../aiInterviewerReviews/enums/interviewer-review-status.enum';
import { InterviewerReviewEntity } from '../../aiInterviewerReviews/entities/interviewer-review.entity';

@Injectable()
export class DecisionScoreHelper {
  calculateFinalScore(options: {
    aiFeedback?: AiInterviewFeedbackEntity | null;
    interviewerReviews?: InterviewerReviewEntity[];
  }): string | null {
    const aiScore = this.toNumber(options.aiFeedback?.overall_score ?? null);
    const submittedReviews = (options.interviewerReviews ?? []).filter(
      (review) => review.review_status === InterviewerReviewStatus.SUBMITTED,
    );
    const reviewerScores = submittedReviews
      .map((review) => this.toNumber(review.overall_score))
      .filter((value): value is number => value !== null);

    if (aiScore === null || !reviewerScores.length) {
      return null;
    }

    const reviewerAverage =
      reviewerScores.reduce((sum, value) => sum + value, 0) /
      reviewerScores.length;

    return ((aiScore + reviewerAverage) / 2).toFixed(2);
  }

  private toNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }
}