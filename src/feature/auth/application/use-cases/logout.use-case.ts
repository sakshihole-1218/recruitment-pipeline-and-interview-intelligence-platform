import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserRepository } from '../../../accessControl/repositories/user.repository';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly userRepository: UserRepository) {}

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
  }
}
