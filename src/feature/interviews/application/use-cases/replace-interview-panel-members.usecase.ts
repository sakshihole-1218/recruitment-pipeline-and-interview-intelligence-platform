import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UserEntity } from '../../../accessControl/entities/user.entity';
import { AssignInterviewPanelMembersDto } from '../../dto/assign-interview-panel-members.dto';
import { InterviewPanelMemberEntity } from '../../entities/interview-panel-member.entity';
import { InterviewsValidationHelper } from '../../helpers/interviews-validation.helper';
import { InterviewRepository } from '../../repositories/interview.repository';
import { InterviewPanelMemberRepository } from '../../repositories/interview-panel-member.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class ReplaceInterviewPanelMembersUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly panelMemberRepository: InterviewPanelMemberRepository,
    private readonly validationHelper: InterviewsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(interviewId: string, dto: AssignInterviewPanelMembersDto, actorUserId: string) {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const interview = await this.interviewRepository.findById(interviewId, {
        manager,
      });

      if (!interview) {
        throw new NotFoundException({
          message: 'Interview not found',
          code: 'INTERVIEW_NOT_FOUND',
        });
      }

      this.validationHelper.ensureUniquePanelMembers(dto.members);

      const userIds = dto.members.map((m) => m.user_id);
      const users = userIds.length
        ? await manager
            .getRepository(UserEntity)
            .createQueryBuilder('users')
            .where('users.id IN (:...userIds)', { userIds })
            .andWhere('users.deleted_at IS NULL')
            .getMany()
        : [];

      const found = new Set(users.map((u) => u.id));
      const missing = userIds.filter((id) => !found.has(id));

      if (missing.length) {
        throw new BadRequestException({
          message: 'One or more panel members are invalid users',
          code: 'PANEL_MEMBER_INVALID_USER',
          meta: { missing_user_ids: missing },
        });
      }

      const existingAll = await manager
        .getRepository(InterviewPanelMemberEntity)
        .find({ where: { interview_id: interviewId }, withDeleted: true });

      const oldActivePanelUserIds = existingAll
        .filter((m) => !m.deleted_at)
        .map((m) => m.user_id)
        .sort();

      const existingByUserId = new Map(existingAll.map((m) => [m.user_id, m] as const));
      const desiredUserIds = new Set(userIds);

      for (const desired of dto.members) {
        const existing = existingByUserId.get(desired.user_id);

        if (existing) {
          const needsRestore = Boolean(existing.deleted_at);
          const needsRoleUpdate = existing.role_in_panel !== desired.role_in_panel;

          if (needsRestore || needsRoleUpdate) {
            existing.deleted_at = null;
            existing.role_in_panel = desired.role_in_panel;
            await this.panelMemberRepository.save(existing, { manager });
          }

          continue;
        }

        await this.panelMemberRepository.createAndSave(
          {
            interview_id: interviewId,
            user_id: desired.user_id,
            role_in_panel: desired.role_in_panel,
            deleted_at: null,
          },
          { manager },
        );
      }

      for (const member of existingAll) {
        if (!member.deleted_at && !desiredUserIds.has(member.user_id)) {
          member.deleted_at = new Date();
          await this.panelMemberRepository.save(member, { manager });
        }
      }

      const updated = await this.panelMemberRepository.listByInterviewId(interviewId, {
        manager,
      });

      if (!updated.length) {
        throw new ConflictException({
          message: 'Interview panel must have at least one member',
          code: 'INTERVIEW_PANEL_EMPTY',
        });
      }

      const updatedInterview = await this.interviewRepository.findById(interviewId, {
        manager,
        withRelations: true,
      });

      if (!updatedInterview) {
        throw new NotFoundException({
          message: 'Interview not found',
          code: 'INTERVIEW_NOT_FOUND',
        });
      }

      const newActivePanelUserIds = updated
        .filter((m) => !m.deleted_at)
        .map((m) => m.user_id)
        .sort();

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.INTERVIEW,
          entityId: updatedInterview.id,
          actionType: ActivityActionType.UPDATE,
          actorUserId,
          oldValues: {
            panel_member_user_ids: oldActivePanelUserIds,
          },
          newValues: {
            panel_member_user_ids: newActivePanelUserIds,
            changed_fields: ['panel_members'],
          },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      return updatedInterview;
    });
  }
}
