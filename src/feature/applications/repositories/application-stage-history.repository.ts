import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';
import { ApplicationStageHistoryEntity } from '../entities/application-stage-history.entity';

@Injectable()
export class ApplicationStageHistoryRepository {
  constructor(
    @InjectRepository(ApplicationStageHistoryEntity)
    private readonly repository: Repository<ApplicationStageHistoryEntity>,
  ) {}

  private repo(
    manager?: EntityManager,
  ): Repository<ApplicationStageHistoryEntity> {
    return manager
      ? manager.getRepository(ApplicationStageHistoryEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'application_stage_history',
    manager?: EntityManager,
  ): SelectQueryBuilder<ApplicationStageHistoryEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async createAndSave(
    payload: Partial<ApplicationStageHistoryEntity>,
    options: { manager: EntityManager },
  ): Promise<ApplicationStageHistoryEntity> {
    const entity = this.repo(options.manager).create(payload);
    return this.repo(options.manager).save(entity);
  }

  async listByApplicationId(
    applicationId: string,
  ): Promise<ApplicationStageHistoryEntity[]> {
    return this.baseQuery('application_stage_history')
      .andWhere('application_stage_history.application_id = :applicationId', {
        applicationId,
      })
      .orderBy('application_stage_history.changed_at', 'ASC')
      .addOrderBy('application_stage_history.id', 'ASC')
      .getMany();
  }

  async findLatestHoldEntry(options: {
    applicationId: string;
    manager?: EntityManager;
  }): Promise<ApplicationStageHistoryEntity | null> {
    return this.baseQuery('application_stage_history', options.manager)
      .andWhere('application_stage_history.application_id = :applicationId', {
        applicationId: options.applicationId,
      })
      .andWhere('application_stage_history.to_stage = :toStage', {
        toStage: ApplicationCurrentStage.ON_HOLD,
      })
      .orderBy('application_stage_history.changed_at', 'DESC')
      .addOrderBy('application_stage_history.id', 'DESC')
      .getOne();
  }
}
