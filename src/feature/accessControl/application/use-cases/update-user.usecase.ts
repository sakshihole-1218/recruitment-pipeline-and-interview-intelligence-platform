import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserEntity } from '../../entities/user.entity';
import { normalizeEmail } from '../../../../common/utils/normalization.util';
import { PasswordHashingHelper } from '../../helpers/password-hashing.helper';
import { UserRepository } from '../../repositories/user.repository';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateUserDto,
    actorUserId?: string,
  ): Promise<UserEntity> {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.userRepository.findById(id, { manager });

      if (!user) {
        throw new NotFoundException({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

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
      }

      if (dto.first_name !== undefined) user.first_name = dto.first_name;
      if (dto.last_name !== undefined) user.last_name = dto.last_name;
      if (dto.phone !== undefined) user.phone = dto.phone ?? null;
      if (dto.is_active !== undefined) user.is_active = dto.is_active;

      if (dto.password) {
        user.password_hash = await PasswordHashingHelper.hashPassword(dto.password);
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

      return updated;
    });
  }
}
