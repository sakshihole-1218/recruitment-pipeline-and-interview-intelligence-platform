import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from '@jest/globals';

import { InterviewerReviewStatus } from '../enums/interviewer-review-status.enum';
import { InterviewerReviewsValidationHelper } from './interviewer-reviews-validation.helper';

describe('InterviewerReviewsValidationHelper', () => {
  const helper = new InterviewerReviewsValidationHelper();

  it('rejects interviewer create requests when reviewer_user_id does not match the actor', () => {
    expect(() =>
      helper.ensureInterviewerReviewerIdentity(
        true,
        'actor-user-id',
        'different-reviewer-id',
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects interviewer access to another reviewer ownership', () => {
    expect(() =>
      helper.ensureInterviewerOwnsReview(true, 'actor-user-id', {
        reviewer_user_id: 'different-reviewer-id',
        review_status: InterviewerReviewStatus.DRAFT,
      } as any),
    ).toThrow(ForbiddenException);
  });

  it('allows broader roles to bypass interviewer-only ownership narrowing', () => {
    expect(() =>
      helper.ensureInterviewerOwnsReview(false, 'actor-user-id', {
        reviewer_user_id: 'different-reviewer-id',
        review_status: InterviewerReviewStatus.DRAFT,
      } as any),
    ).not.toThrow();
  });
});
