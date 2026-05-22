import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateUserDto } from '../../dto/create-user.dto';
import { UserEntity } from '../../entities/user.entity';
import { normalizeEmail } from '../../../../common/utils/normalization.util';
import { PasswordHashingHelper } from '../../helpers/password-hashing.helper';
import { RoleRepository } from '../../repositories/role.repository';
import { UserRepository } from '../../repositories/user.repository';
import { UserRoleRepository } from '../../repositories/user-role.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(dto: CreateUserDto, actorUserId?: string): Promise<UserEntity> {
    const normalizedEmail = normalizeEmail(dto.email);

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const existing = await this.userRepository.findByNormalizedEmail(normalizedEmail, {
        includeDeleted: true,
        manager,
      });

      if (existing) {
        throw new ConflictException({
          message: 'An account with this email already exists',
          code: 'USER_EMAIL_ALREADY_EXISTS',
        });
      }

      const user = await this.userRepository.createAndSave(
        {
          first_name: dto.first_name,
          last_name: dto.last_name,
          email: normalizedEmail,
          phone: dto.phone ?? null,
          password_hash: await PasswordHashingHelper.hashPassword(dto.password),
          refresh_token_hash: null,
          is_active: true,
          last_login_at: null,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: null,
          deleted_by_user_id: null,
        },
        { manager },
      );

      const assignedRoleCodes: string[] = [];

      if (dto.role_codes && dto.role_codes.length > 0) {
        const uniqueCodes = Array.from(new Set(dto.role_codes));

        for (const roleCode of uniqueCodes) {
          const role = await this.roleRepository.findByCode(String(roleCode), {
            manager,
          });

          if (!role) {
            throw new BadRequestException({
              message: 'One or more selected roles are invalid',
              code: 'INVALID_ROLE_CODE',
            });
          }

          await this.userRoleRepository.createAndSave(
            {
              user_id: user.id,
              role_id: role.id,
              deleted_at: null,
            },
            { manager },
          );

          assignedRoleCodes.push(role.code);
        }
      }

      const created = await this.userRepository.findById(user.id, { manager });

      if (!created) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'USER_POST_CREATE_LOAD_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.USER,
            entityId: created.id,
            actionType: ActivityActionType.CREATE,
            actorUserId,
            oldValues: null,
            newValues: {
              is_active: created.is_active,
              has_phone: Boolean(created.phone),
              role_codes: assignedRoleCodes,
            },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      return created;
    });
  }
}
