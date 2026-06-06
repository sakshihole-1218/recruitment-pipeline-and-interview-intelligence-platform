import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { JobOpeningEntity } from '../../job-openings/entities/job-opening.entity';
import { JobOpeningSkillEntity } from '../../job-openings/entities/job-opening-skill.entity';
import { SkillEntity } from '../../skills/entities/skill.entity';
import { ResumeAiAnalysisEntity } from '../../aiInsights/entities/resume-ai-analysis.entity';
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';

@Injectable()
export class AiInterviewQuestionsReferenceRepository {
  constructor(
    @InjectRepository(AiInterviewSessionEntity)
    private readonly sessions: Repository<AiInterviewSessionEntity>,
    @InjectRepository(ResumeAiAnalysisEntity)
    private readonly resumeAnalyses: Repository<ResumeAiAnalysisEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(CandidateEntity)
    private readonly candidates: Repository<CandidateEntity>,
    @InjectRepository(JobOpeningEntity)
    private readonly jobOpenings: Repository<JobOpeningEntity>,
    @InjectRepository(JobOpeningSkillEntity)
    private readonly jobOpeningSkills: Repository<JobOpeningSkillEntity>,
  ) {}

  private repo<T extends ObjectLiteral>(
    repo: Repository<T>,
    manager?: EntityManager,
  ): Repository<T> {
    return manager ? manager.getRepository<T>(repo.target as any) : repo;
  }

  findSessionById(
    id: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewSessionEntity | null> {
    const qb = this.repo(this.sessions, options?.manager)
      .createQueryBuilder('ai_interview_sessions')
      .where('ai_interview_sessions.deleted_at IS NULL')
      .andWhere('ai_interview_sessions.id = :id', { id });

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  saveSession(
    entity: AiInterviewSessionEntity,
    manager?: EntityManager,
  ): Promise<AiInterviewSessionEntity> {
    return this.repo(this.sessions, manager).save(entity);
  }

  async updateSessionQuestionGenerationStatus(options: {
    sessionId: string;
    status: AiInterviewSessionEntity['question_generation_status'];
    actorUserId?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const now = new Date();

    await this.repo(this.sessions, options.manager)
      .createQueryBuilder()
      .update(AiInterviewSessionEntity)
      .set({
        question_generation_status: options.status,
        updated_at: now,
        updated_by_user_id: options.actorUserId ?? null,
      })
      .where('id = :sessionId', { sessionId: options.sessionId })
      .andWhere('deleted_at IS NULL')
      .execute();
  }

  findResumeAnalysisById(
    id: string,
    manager?: EntityManager,
  ): Promise<ResumeAiAnalysisEntity | null> {
    return this.repo(this.resumeAnalyses, manager)
      .createQueryBuilder('resume_ai_analyses')
      .where('resume_ai_analyses.deleted_at IS NULL')
      .andWhere('resume_ai_analyses.id = :id', { id })
      .getOne();
  }

  findApplicationById(
    id: string,
    manager?: EntityManager,
  ): Promise<ApplicationEntity | null> {
    return this.repo(this.applications, manager)
      .createQueryBuilder('applications')
      .where('applications.deleted_at IS NULL')
      .andWhere('applications.id = :id', { id })
      .getOne();
  }

  findCandidateById(
    id: string,
    manager?: EntityManager,
  ): Promise<CandidateEntity | null> {
    return this.repo(this.candidates, manager)
      .createQueryBuilder('candidates')
      .where('candidates.deleted_at IS NULL')
      .andWhere('candidates.id = :id', { id })
      .getOne();
  }

  findJobOpeningById(
    id: string,
    manager?: EntityManager,
  ): Promise<JobOpeningEntity | null> {
    return this.repo(this.jobOpenings, manager)
      .createQueryBuilder('job_openings')
      .where('job_openings.deleted_at IS NULL')
      .andWhere('job_openings.id = :id', { id })
      .getOne();
  }

  listJobSkillsByJobOpeningId(
    jobOpeningId: string,
    manager?: EntityManager,
  ): Promise<JobOpeningSkillEntity[]> {
    return this.repo(this.jobOpeningSkills, manager)
      .createQueryBuilder('job_opening_skills')
      .leftJoinAndMapOne(
        'job_opening_skills.skill',
        SkillEntity,
        'skills',
        'skills.id = job_opening_skills.skill_id AND skills.deleted_at IS NULL',
      )
      .where('job_opening_skills.deleted_at IS NULL')
      .andWhere('job_opening_skills.job_opening_id = :jobOpeningId', {
        jobOpeningId,
      })
      .orderBy('job_opening_skills.is_mandatory', 'DESC')
      .addOrderBy('job_opening_skills.created_at', 'ASC')
      .getMany();
  }
}
