import { ActivityActionType } from '../enums/activity-action-type.enum';
import { ActivityEntityType } from '../enums/activity-entity-type.enum';

export type ActivityLogValues = Record<string, unknown>;

export interface ActivityLogBuildOptions {
  entityType: ActivityEntityType;
  entityId: string;
  actionType: ActivityActionType;
  actorUserId: string;
  oldValues?: ActivityLogValues | null;
  newValues?: ActivityLogValues | null;
  actionAt?: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class ActivityLogBuilder {
  static build(options: ActivityLogBuildOptions) {
    return {
      entity_type: options.entityType,
      entity_id: options.entityId,
      action_type: options.actionType,
      old_values: options.oldValues ?? null,
      new_values: options.newValues ?? null,
      action_by_user_id: options.actorUserId,
      action_at: options.actionAt ?? new Date(),
      ip_address: options.ipAddress ?? null,
      user_agent: options.userAgent ?? null,
    };
  }

  static stageChange(options: {
    entityType: ActivityEntityType;
    entityId: string;
    fromStage: string;
    toStage: string;
    reason?: string | null;
    actorUserId: string;
    actionAt?: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return this.build({
      entityType: options.entityType,
      entityId: options.entityId,
      actionType: ActivityActionType.STAGE_CHANGE,
      actorUserId: options.actorUserId,
      oldValues: { from_stage: options.fromStage },
      newValues: { to_stage: options.toStage, reason: options.reason ?? null },
      actionAt: options.actionAt,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });
  }
}
