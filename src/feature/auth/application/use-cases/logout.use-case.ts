import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserRepository } from '../../../accessControl/repositories/user.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Please log in to continue',
        code: 'UNAUTHORIZED',
      });
    }

    user.refresh_token_hash = null;
    user.updated_by_user_id = user.id;

    await this.userRepository.save(user);

    await this.activityWriter.log(
      ActivityLogBuilder.build({
        entityType: ActivityEntityType.USER,
        entityId: user.id,
        actionType: ActivityActionType.LOGOUT,
        actorUserId: user.id,
        oldValues: null,
        newValues: null,
        actionAt: new Date(),
        ipAddress: null,
        userAgent: null,
      }),
    );
  }
}
