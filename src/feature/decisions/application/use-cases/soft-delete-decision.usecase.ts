import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../../accessControl/enums/system-role-code.enum';
import { UserRepository } from '../../../accessControl/repositories/user.repository';
import { ApplicationDecisionRepository } from '../../repositories/application-decision.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { DecisionStatus } from '../../enums/decision-status.enum';

@Injectable()
export class SoftDeleteDecisionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly decisionRepository: ApplicationDecisionRepository,
    private readonly userRepository: UserRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, actorPayload: AuthJwtPayload): Promise<void> {
    const actorUserId = actorPayload?.sub;
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    await this.dataSource.transaction(async (manager) => {
      const actor = await this.userRepository.findById(actorUserId, {
        manager,
      });
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

      const isAdmin = actorPayload.roles?.includes(SystemRoleCode.ADMIN);
      const canHiringManagerDelete =
        decision.decision_status === DecisionStatus.HOLD;

      if (!isAdmin && !canHiringManagerDelete) {
        throw new ConflictException({
          message:
            'Finalized decisions can only be deleted by an admin. Hiring managers may only delete HOLD decisions.',
          code: 'DECISION_DELETE_FINALITY_RESTRICTED',
          meta: { decision_status: decision.decision_status },
        });
      }

      const now = new Date();

      decision.deleted_at = now;
      decision.deleted_by_user_id = actor.id;
      decision.updated_by_user_id = actor.id;

      await this.decisionRepository.save(decision, { manager });

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.DECISION,
          entityId: decision.id,
          actionType: ActivityActionType.DELETE,
          actorUserId: actor.id,
          oldValues: { deleted_at: null },
          newValues: { deleted_at: now.toISOString() },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );
    });
  }
}
