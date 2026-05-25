import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UserEntity } from '../../../accessControl/entities/user.entity';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { BulkAssignPanelMembersDto } from '../../dto/bulk-assign-panel-members.dto';
import {
  BulkAssignPanelMembersResultResponseDto,
  BulkInterviewOperationFailureDto,
} from '../../dto/bulk-operation-result.response.dto';
import { InterviewPanelRole } from '../../enums/interview-panel-role.enum';
import { InterviewPanelMemberRepository } from '../../repositories/interview-panel-member.repository';
import { InterviewRepository } from '../../repositories/interview.repository';

@Injectable()
export class BulkAssignPanelMembersUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly panelMemberRepository: InterviewPanelMemberRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    dto: BulkAssignPanelMembersDto,
    actorUserId?: string,
  ): Promise<BulkAssignPanelMembersResultResponseDto> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    const uniqueUserIds = this.ensureUniqueIds(dto.panel_member_user_ids, {
      errorMessage: 'Duplicate panel members are not allowed',
      errorCode: 'DUPLICATE_PANEL_MEMBER',
    });

    await this.ensureUsersExist(uniqueUserIds);

    const successfulIds: string[] = [];
    const failures: BulkInterviewOperationFailureDto[] = [];

    for (const interviewId of dto.interview_ids) {
      try {
        await this.dataSource.transaction(async (manager) => {
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

          const oldActiveMembers = await this.panelMemberRepository.listByInterviewId(
            interviewId,
            { manager },
          );

          const oldActiveUserIds = oldActiveMembers
            .filter((m) => !m.deleted_at)
            .map((m) => m.user_id)
            .sort();

          let changed = false;

          for (const userId of uniqueUserIds) {
            const existing = await this.panelMemberRepository.findByInterviewAndUser(
              interviewId,
              userId,
              { includeDeleted: true, manager },
            );

            if (existing) {
              if (existing.deleted_at) {
                existing.deleted_at = null;
                await this.panelMemberRepository.save(existing, { manager });
                changed = true;
              }
              continue;
            }

            try {
              await this.panelMemberRepository.createAndSave(
                {
                  interview_id: interviewId,
                  user_id: userId,
                  role_in_panel: InterviewPanelRole.PANELIST,
                  deleted_at: null,
                },
                { manager },
              );
              changed = true;
            } catch (error: any) {
              if (String(error?.code) === '23505') {
                continue;
              }
              throw error;
            }
          }

          if (!changed) {
            return;
          }

          const updated = await this.panelMemberRepository.listByInterviewId(interviewId, {
            manager,
          });

          const newActiveUserIds = updated
            .filter((m) => !m.deleted_at)
            .map((m) => m.user_id)
            .sort();

          if (!newActiveUserIds.length) {
            throw new ConflictException({
              message: 'Interview panel must have at least one member',
              code: 'INTERVIEW_PANEL_EMPTY',
            });
          }

          await this.activityWriter.log(
            ActivityLogBuilder.build({
              entityType: ActivityEntityType.INTERVIEW,
              entityId: interviewId,
              actionType: ActivityActionType.UPDATE,
              actorUserId,
              oldValues: { panel_member_user_ids: oldActiveUserIds },
              newValues: {
                panel_member_user_ids: newActiveUserIds,
                changed_fields: ['panel_members'],
              },
              actionAt: now,
              ipAddress: null,
              userAgent: null,
            }),
            { manager },
          );
        });

        successfulIds.push(interviewId);
      } catch (error) {
        failures.push({
          interview_id: interviewId,
          reason: this.extractErrorReason(error),
        });
      }
    }

    return {
      success_count: successfulIds.length,
      failed_count: failures.length,
      successful_ids: successfulIds,
      failures,
    };
  }

  private ensureUniqueIds(
    ids: string[],
    options: { errorMessage: string; errorCode: string },
  ): string[] {
    const unique = new Set<string>();
    for (const id of ids) unique.add(String(id));

    if (unique.size !== ids.length) {
      throw new BadRequestException({
        message: options.errorMessage,
        code: options.errorCode,
      });
    }

    return Array.from(unique);
  }

  private async ensureUsersExist(userIds: string[]): Promise<void> {
    const users = userIds.length
      ? await this.dataSource
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
  }

  private extractErrorReason(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object') {
        const message = (response as any).message;
        if (typeof message === 'string') return message;
        if (Array.isArray(message) && message.length) return String(message[0]);
      }
      return error.message;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }

    return 'Unable to process record';
  }
}
