import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

import { UserEntity } from '../../accessControl/entities/user.entity';
import { AiInterviewFeedbackEntity } from '../../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { InterviewPanelMemberEntity } from '../../interviews/entities/interview-panel-member.entity';

@Injectable()
export class InterviewerReviewReferenceRepository {
  constructor(
    @InjectRepository(AiInterviewSessionEntity)
    private readonly sessions: Repository<AiInterviewSessionEntity>,
    @InjectRepository(AiInterviewFeedbackEntity)
    private readonly feedback: Repository<AiInterviewFeedbackEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(InterviewPanelMemberEntity)
    private readonly panelMembers: Repository<InterviewPanelMemberEntity>,
  ) {}

  private repo<T extends ObjectLiteral>(
    repo: Repository<T>,
    manager?: EntityManager,
  ): Repository<T> {
    return manager ? manager.getRepository<T>(repo.target as any) : repo;
  }

  findSessionById(
    sessionId: string,
    manager?: EntityManager,
  ): Promise<AiInterviewSessionEntity | null> {
    return this.repo(this.sessions, manager)
      .createQueryBuilder('ai_interview_sessions')
      .where('ai_interview_sessions.id = :id', { id: sessionId })
      .andWhere('ai_interview_sessions.deleted_at IS NULL')
      .getOne();
  }

  findFeedbackById(
    feedbackId: string,
    manager?: EntityManager,
  ): Promise<AiInterviewFeedbackEntity | null> {
    return this.repo(this.feedback, manager)
      .createQueryBuilder('ai_interview_feedback')
      .where('ai_interview_feedback.id = :id', { id: feedbackId })
      .andWhere('ai_interview_feedback.deleted_at IS NULL')
      .getOne();
  }

  findActiveUserById(
    userId: string,
    manager?: EntityManager,
  ): Promise<UserEntity | null> {
    return this.repo(this.users, manager)
      .createQueryBuilder('users')
      .where('users.id = :id', { id: userId })
      .andWhere('users.deleted_at IS NULL')
      .andWhere('users.is_active = :isActive', { isActive: true })
      .getOne();
  }

  findApplicationById(
    applicationId: string,
    manager?: EntityManager,
  ): Promise<ApplicationEntity | null> {
    return this.repo(this.applications, manager)
      .createQueryBuilder('applications')
      .where('applications.id = :id', { id: applicationId })
      .andWhere('applications.deleted_at IS NULL')
      .getOne();
  }

  listPanelMembersByInterviewId(
    interviewId: string,
    manager?: EntityManager,
  ): Promise<InterviewPanelMemberEntity[]> {
    return this.repo(this.panelMembers, manager)
      .createQueryBuilder('interview_panel_members')
      .where('interview_panel_members.interview_id = :interviewId', {
        interviewId,
      })
      .andWhere('interview_panel_members.deleted_at IS NULL')
      .orderBy('interview_panel_members.created_at', 'ASC')
      .getMany();
  }
}
