import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UserRepository } from '../../../accessControl/repositories/user.repository';
import { ApplicationDecisionRepository } from '../../repositories/application-decision.repository';

@Injectable()
export class SoftDeleteDecisionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly decisionRepository: ApplicationDecisionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string, actorUserId: string): Promise<void> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    await this.dataSource.transaction(async (manager) => {
      const actor = await this.userRepository.findById(actorUserId, { manager });
      if (!actor) {
        throw new NotFoundException({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      const decision = await this.decisionRepository.findById(id, { manager });
      if (!decision) {
        throw new NotFoundException({
          message: 'Decision not found',
          code: 'DECISION_NOT_FOUND',
        });
      }

      decision.deleted_at = new Date();
      decision.deleted_by_user_id = actor.id;
      decision.updated_by_user_id = actor.id;

      await this.decisionRepository.save(decision, { manager });
    });
  }
}
