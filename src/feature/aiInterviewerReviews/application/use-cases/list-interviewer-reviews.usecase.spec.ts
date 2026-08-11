import { describe, expect, it, jest } from '@jest/globals';

import { ListInterviewerReviewsUseCase } from './list-interviewer-reviews.usecase';

describe('ListInterviewerReviewsUseCase', () => {
  it('forces interviewer-only list queries to the authenticated reviewer_user_id', async () => {
    const repository = {
      findAllWithFilters: jest.fn(async () => ({
        mode: 'offset',
        data: [],
        page: 1,
        limit: 10,
        total_records: 0,
      })),
    };
    const helper = {
      assertCanAccessAiSession: jest.fn(),
      assertCanAccessApplication: jest.fn(),
      isInterviewerOnly: jest.fn().mockReturnValue(true),
    };

    const useCase = new ListInterviewerReviewsUseCase(
      repository as any,
      helper as any,
    );

    await useCase.execute(
      {
        reviewer_user_id: 'someone-else',
      } as any,
      {
        sub: 'interviewer-user-id',
        email: 'interviewer@example.com',
        roles: ['INTERVIEWER'] as any,
      },
    );

    expect(repository.findAllWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewer_user_id: 'interviewer-user-id',
      }),
    );
  });
});
