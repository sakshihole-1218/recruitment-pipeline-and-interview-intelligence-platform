import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserEntity } from '../../entities/user.entity';
import { normalizeEmail } from '../../../../common/utils/normalization.util';
import { PasswordHashingHelper } from '../../helpers/password-hashing.helper';
import { UserRepository } from '../../repositories/user.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    id: string,
    dto: UpdateUserDto,
    actorUserId?: string,
  ): Promise<UserEntity> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const user = await this.userRepository.findById(id, { manager });

      if (!user) {
        throw new NotFoundException({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      const changedFields: string[] = [];
      const oldIsActive = user.is_active;

      if (dto.email) {
        const normalizedEmail = normalizeEmail(dto.email);

        const emailOwner = await this.userRepository.findByNormalizedEmail(normalizedEmail, {
          includeDeleted: true,
          manager,
        });

        if (emailOwner && emailOwner.id !== user.id) {
          throw new ConflictException({
            message: 'An account with this email already exists',
            code: 'USER_EMAIL_ALREADY_EXISTS',
          });
        }

        user.email = normalizedEmail;
        changedFields.push('email');
      }

      if (dto.first_name !== undefined) {
        user.first_name = dto.first_name;
        changedFields.push('first_name');
      }
      if (dto.last_name !== undefined) {
        user.last_name = dto.last_name;
        changedFields.push('last_name');
      }
      if (dto.phone !== undefined) {
        user.phone = dto.phone ?? null;
        changedFields.push('phone');
      }
      if (dto.is_active !== undefined) {
        user.is_active = dto.is_active;
        changedFields.push('is_active');
      }

      if (dto.password) {
        user.password_hash = await PasswordHashingHelper.hashPassword(dto.password);
        changedFields.push('password');
      }

      if (actorUserId) {
        user.updated_by_user_id = actorUserId;
      }

      await this.userRepository.save(user, { manager });

      const updated = await this.userRepository.findById(user.id, { manager });
      if (!updated) {
        throw new NotFoundException({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      if (actorUserId && changedFields.length) {
        const isStatusChange =
          changedFields.includes('is_active') && oldIsActive !== updated.is_active;

        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.USER,
            entityId: updated.id,
            actionType: isStatusChange
              ? ActivityActionType.STATUS_CHANGE
              : ActivityActionType.UPDATE,
            actorUserId,
            oldValues: isStatusChange
              ? { is_active: oldIsActive }
              : { changed_fields: changedFields },
            newValues: isStatusChange
              ? {
                  is_active: updated.is_active,
                  changed_fields: changedFields,
                  password_changed: changedFields.includes('password'),
                }
              : {
                  changed_fields: changedFields,
                  password_changed: changedFields.includes('password'),
                },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      return updated;
    });
  }
}
