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

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserEntity> {
    const normalizedEmail = normalizeEmail(dto.email);

    return this.dataSource.transaction(async (manager) => {
      const existing = await this.userRepository.findByNormalizedEmail(normalizedEmail, {
        includeDeleted: true,
        manager,
      });

      if (existing) {
        throw new ConflictException({
          message: 'Email already exists',
          code: 'USER_EMAIL_ALREADY_EXISTS',
        });
      }

      const user = await this.userRepository.createAndSave(
        {
          first_name: dto.first_name,
          last_name: dto.last_name,
          email: normalizedEmail,
          phone: dto.phone ?? null,
          password_hash: PasswordHashingHelper.hashPassword(dto.password),
          refresh_token_hash: null,
          is_active: true,
          last_login_at: null,
          created_by_user_id: dto.created_by_user_id ?? null,
          updated_by_user_id: null,
          deleted_by_user_id: null,
        },
        { manager },
      );

      if (dto.role_codes && dto.role_codes.length > 0) {
        const uniqueCodes = Array.from(new Set(dto.role_codes));

        for (const roleCode of uniqueCodes) {
          const role = await this.roleRepository.findByCode(String(roleCode), {
            manager,
          });

          if (!role) {
            throw new BadRequestException({
              message: `Invalid role code: ${roleCode}`,
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
        }
      }

      const created = await this.userRepository.findById(user.id, { manager });

      if (!created) {
        throw new ConflictException({
          message: 'User could not be loaded after creation',
          code: 'USER_POST_CREATE_LOAD_FAILED',
        });
      }

      return created;
    });
  }
}
