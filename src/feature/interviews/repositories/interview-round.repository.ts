import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { InterviewRoundEntity } from '../entities/interview-round.entity';

@Injectable()
export class InterviewRoundRepository {
  constructor(
    @InjectRepository(InterviewRoundEntity)
    private readonly repository: Repository<InterviewRoundEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<InterviewRoundEntity> {
    return manager ? manager.getRepository(InterviewRoundEntity) : this.repository;
  }

  private baseQuery(
    alias = 'interview_rounds',
    manager?: EntityManager,
  ): SelectQueryBuilder<InterviewRoundEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<InterviewRoundEntity | null> {
    return this.baseQuery('interview_rounds', options?.manager)
      .andWhere('interview_rounds.id = :id', { id })
      .getOne();
  }

  async findByJobOpeningAndSequence(
    jobOpeningId: string,
    sequenceNumber: number,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<InterviewRoundEntity | null> {
    const repo = this.repo(options?.manager);

    return repo.findOne({
      where: {
        job_opening_id: jobOpeningId,
        sequence_number: sequenceNumber,
      },
      withDeleted: options?.includeDeleted ?? false,
    });
  }

  async listByJobOpeningId(
    jobOpeningId: string,
    options?: { manager?: EntityManager },
  ): Promise<InterviewRoundEntity[]> {
    return this.baseQuery('interview_rounds', options?.manager)
      .andWhere('interview_rounds.job_opening_id = :jobOpeningId', {
        jobOpeningId,
      })
      .orderBy('interview_rounds.sequence_number', 'ASC')
      .addOrderBy('interview_rounds.created_at', 'ASC')
      .getMany();
  }

  async save(
    entity: InterviewRoundEntity,
    options?: { manager?: EntityManager },
  ): Promise<InterviewRoundEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<InterviewRoundEntity>,
    options?: { manager?: EntityManager },
  ): Promise<InterviewRoundEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }
}
