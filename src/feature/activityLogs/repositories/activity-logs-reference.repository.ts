import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { ApplicationEntity } from '../../applications/entities/application.entity';
import { UserEntity } from '../../accessControl/entities/user.entity';

@Injectable()
export class ActivityLogsReferenceRepository {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  private appRepo(manager?: EntityManager): Repository<ApplicationEntity> {
    return manager
      ? manager.getRepository(ApplicationEntity)
      : this.applications;
  }

  private userRepo(manager?: EntityManager): Repository<UserEntity> {
    return manager ? manager.getRepository(UserEntity) : this.users;
  }

  async ensureApplicationExists(
    applicationId: string,
    options?: { manager?: EntityManager },
  ) {
    const found = await this.appRepo(options?.manager).findOne({
      where: { id: applicationId },
      withDeleted: false,
    });

    if (!found) {
      throw new NotFoundException({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND',
      });
    }
  }

  async ensureUserExists(
    userId: string,
    options?: { manager?: EntityManager },
  ) {
    const found = await this.userRepo(options?.manager).findOne({
      where: { id: userId },
      withDeleted: false,
    });

    if (!found) {
      throw new NotFoundException({
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }
  }
}
