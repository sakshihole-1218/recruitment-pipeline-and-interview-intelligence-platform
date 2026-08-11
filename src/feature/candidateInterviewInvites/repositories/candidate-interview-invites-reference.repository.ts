import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { JobOpeningEntity } from '../../job-openings/entities/job-opening.entity';
import { InterviewRoundEntity } from '../../interviews/entities/interview-round.entity';
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';
import { AiInterviewFeedbackEntity } from '../../aiInterviewFeedback/entities/ai-interview-feedback.entity';

@Injectable()
export class CandidateInterviewInvitesReferenceRepository {
  constructor(
    @InjectRepository(InterviewEntity)
    private readonly interviews: Repository<InterviewEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(CandidateEntity)
    private readonly candidates: Repository<CandidateEntity>,
    @InjectRepository(JobOpeningEntity)
    private readonly jobOpenings: Repository<JobOpeningEntity>,
    @InjectRepository(InterviewRoundEntity)
    private readonly interviewRounds: Repository<InterviewRoundEntity>,
    @InjectRepository(AiInterviewSessionEntity)
    private readonly sessions: Repository<AiInterviewSessionEntity>,
    @InjectRepository(AiInterviewFeedbackEntity)
    private readonly feedback: Repository<AiInterviewFeedbackEntity>,
  ) {}

  private repo<T extends ObjectLiteral>(
    repository: Repository<T>,
    manager?: EntityManager,
  ): Repository<T> {
    return manager
      ? manager.getRepository<T>(repository.target as any)
      : repository;
  }

  findInterviewById(id: string, manager?: EntityManager) {
    return this.repo(this.interviews, manager)
      .createQueryBuilder('interviews')
      .leftJoinAndSelect('interviews.application', 'application')
      .leftJoinAndSelect('application.job_opening', 'job_opening')
      .leftJoinAndSelect('interviews.interview_round', 'interview_round')
      .where('interviews.id = :id', { id })
      .andWhere('interviews.deleted_at IS NULL')
      .getOne();
  }

  findApplicationById(id: string, manager?: EntityManager) {
    return this.repo(this.applications, manager)
      .createQueryBuilder('applications')
      .where('applications.id = :id', { id })
      .andWhere('applications.deleted_at IS NULL')
      .getOne();
  }

  findCandidateById(id: string, manager?: EntityManager) {
    return this.repo(this.candidates, manager)
      .createQueryBuilder('candidates')
      .where('candidates.id = :id', { id })
      .andWhere('candidates.deleted_at IS NULL')
      .getOne();
  }

  findActiveAiSessionByInterviewId(interviewId: string, manager?: EntityManager) {
    return this.repo(this.sessions, manager)
      .createQueryBuilder('ai_interview_sessions')
      .where('ai_interview_sessions.interview_id = :interviewId', {
        interviewId,
      })
      .andWhere('ai_interview_sessions.deleted_at IS NULL')
      .orderBy('ai_interview_sessions.created_at', 'DESC')
      .getOne();
  }

  saveAiSession(entity: AiInterviewSessionEntity, manager?: EntityManager) {
    return this.repo(this.sessions, manager).save(entity);
  }

  findFeedbackBySessionId(sessionId: string, manager?: EntityManager) {
    return this.repo(this.feedback, manager)
      .createQueryBuilder('ai_interview_feedback')
      .where('ai_interview_feedback.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .andWhere('ai_interview_feedback.deleted_at IS NULL')
      .getOne();
  }
}
