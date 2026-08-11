import { ConflictException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { DecisionStatus } from '../../enums/decision-status.enum';
import { SoftDeleteDecisionUseCase } from './soft-delete-decision.usecase';

describe('SoftDeleteDecisionUseCase', () => {
  const createUseCase = () => {
    const dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(async (callback: (manager: unknown) => unknown) =>
          callback({}),
        ),
    };
    const decisionRepository: any = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    const userRepository: any = {
      findById: jest.fn(async () => ({ id: 'actor-id' })),
    };
    const activityWriter = {
      log: jest.fn(),
    };

    return {
      dataSource,
      decisionRepository,
      userRepository,
      activityWriter,
      useCase: new SoftDeleteDecisionUseCase(
        dataSource as any,
        decisionRepository as any,
        userRepository as any,
        activityWriter as any,
      ),
    };
  };

  it('prevents hiring managers from deleting finalized decisions', async () => {
    const { useCase, decisionRepository } = createUseCase();
    decisionRepository.findById.mockImplementation(async () => ({
      id: 'decision-id',
      decision_status: DecisionStatus.SELECTED,
    }));

    await expect(
      useCase.execute('decision-id', {
        sub: 'actor-id',
        email: 'hm@example.com',
        roles: ['HIRING_MANAGER'] as any,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('allows hiring managers to delete HOLD decisions', async () => {
    const { useCase, decisionRepository, activityWriter } = createUseCase();
    decisionRepository.findById.mockImplementation(async () => ({
      id: 'decision-id',
      decision_status: DecisionStatus.HOLD,
    }));

    await expect(
      useCase.execute('decision-id', {
        sub: 'actor-id',
        email: 'hm@example.com',
        roles: ['HIRING_MANAGER'] as any,
      }),
    ).resolves.toBeUndefined();

    expect(decisionRepository.save).toHaveBeenCalled();
    expect(activityWriter.log).toHaveBeenCalled();
  });

  it('allows admins to delete finalized decisions', async () => {
    const { useCase, decisionRepository } = createUseCase();
    decisionRepository.findById.mockImplementation(async () => ({
      id: 'decision-id',
      decision_status: DecisionStatus.HIRED,
    }));

    await expect(
      useCase.execute('decision-id', {
        sub: 'actor-id',
        email: 'admin@example.com',
        roles: ['ADMIN'] as any,
      }),
    ).resolves.toBeUndefined();

    expect(decisionRepository.save).toHaveBeenCalled();
  });
});
