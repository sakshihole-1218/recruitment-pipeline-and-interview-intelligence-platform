import { Injectable, NotFoundException } from '@nestjs/common';

import { ApplicationEntity } from '../../entities/application.entity';
import { ApplicationRepository } from '../../repositories/application.repository';

@Injectable()
export class FindApplicationByIdUseCase {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(id: string): Promise<ApplicationEntity> {
    const app = await this.applicationRepository.findById(id);
    if (!app) {
      throw new NotFoundException({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND',
      });
    }

    return app;
  }
}
