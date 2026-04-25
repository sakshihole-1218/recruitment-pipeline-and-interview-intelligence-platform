import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserRepository } from '../../../accessControl/repositories/user.repository';
import { ProfileResponseDto } from '../../dto/profile-response.dto';
import { AuthMapper } from '../../helpers/auth.mapper';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.is_active) {
      throw new UnauthorizedException({
        message: 'Please log in to continue',
        code: 'UNAUTHORIZED',
      });
    }

    return AuthMapper.toProfile(user);
  }
}
