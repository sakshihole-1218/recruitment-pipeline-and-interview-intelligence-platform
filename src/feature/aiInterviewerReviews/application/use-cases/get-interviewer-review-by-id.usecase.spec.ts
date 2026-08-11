import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { InterviewerReviewStatus } from '../../enums/interviewer-review-status.enum';
import { GetInterviewerReviewByIdUseCase } from './get-interviewer-review-by-id.usecase';

describe('GetInterviewerReviewByIdUseCase', () => {
  it('blocks interviewer-only users from reading another reviewer review', async () => {
    const repository = {
      findById: jest.fn(async () => ({
        id: 'review-id',
        reviewer_user_id: 'different-reviewer-id',
        review_status: InterviewerReviewStatus.DRAFT,
      })),
    };
    const validation = {
      ensureInterviewerOwnsReview: jest
        .fn()
        .mockImplementation(() => {
          throw new ForbiddenException();
        }),
    };
    const helper = {
      assertCanAccessInterviewerReview: jest.fn(async () => undefined),
      isInterviewerOnly: jest.fn().mockReturnValue(true),
    };

    const useCase = new GetInterviewerReviewByIdUseCase(
      repository as any,
      validation as any,
      helper as any,
    );

    await expect(
      useCase.execute('review-id', {
        sub: 'interviewer-user-id',
        email: 'interviewer@example.com',
        roles: ['INTERVIEWER'] as any,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
