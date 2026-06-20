import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { InterviewPanelMemberEntity } from '../entities/interview-panel-member.entity';

@Injectable()
export class InterviewPanelMemberRepository {
  constructor(
    @InjectRepository(InterviewPanelMemberEntity)
    private readonly repository: Repository<InterviewPanelMemberEntity>,
  ) {}

  private repo(
    manager?: EntityManager,
  ): Repository<InterviewPanelMemberEntity> {
    return manager
      ? manager.getRepository(InterviewPanelMemberEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'interview_panel_members',
    manager?: EntityManager,
  ): SelectQueryBuilder<InterviewPanelMemberEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async listByInterviewId(
    interviewId: string,
    options?: { manager?: EntityManager },
  ): Promise<InterviewPanelMemberEntity[]> {
    return this.baseQuery('interview_panel_members', options?.manager)
      .andWhere('interview_panel_members.interview_id = :interviewId', {
        interviewId,
      })
      .orderBy('interview_panel_members.created_at', 'ASC')
      .getMany();
  }

  async findByInterviewAndUser(
    interviewId: string,
    userId: string,
    options?: { includeDeleted?: boolean; manager?: EntityManager },
  ): Promise<InterviewPanelMemberEntity | null> {
    const repo = this.repo(options?.manager);

    return repo.findOne({
      where: { interview_id: interviewId, user_id: userId },
      withDeleted: options?.includeDeleted ?? false,
    });
  }

  async save(
    entity: InterviewPanelMemberEntity,
    options?: { manager?: EntityManager },
  ): Promise<InterviewPanelMemberEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<InterviewPanelMemberEntity>,
    options?: { manager?: EntityManager },
  ): Promise<InterviewPanelMemberEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }
}
