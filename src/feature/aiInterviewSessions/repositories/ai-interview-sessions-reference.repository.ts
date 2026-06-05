import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { ResumeAiAnalysisEntity } from '../../aiInsights/entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisStatus } from '../../aiInsights/enums/resume-ai-analysis-status.enum';

@Injectable()
export class AiInterviewSessionsReferenceRepository {
  constructor(
    @InjectRepository(InterviewEntity)
    private readonly interviews: Repository<InterviewEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(CandidateEntity)
    private readonly candidates: Repository<CandidateEntity>,
    @InjectRepository(ResumeAiAnalysisEntity)
    private readonly resumeAnalyses: Repository<ResumeAiAnalysisEntity>,
  ) {}

  private repo<T extends ObjectLiteral>(
    repo: Repository<T>,
    manager?: EntityManager,
  ): Repository<T> {
    return manager ? manager.getRepository<T>(repo.target as any) : repo;
  }

  findInterviewById(
    interviewId: string,
    manager?: EntityManager,
  ): Promise<InterviewEntity | null> {
    return this.repo(this.interviews, manager)
      .createQueryBuilder('interviews')
      .where('interviews.id = :id', { id: interviewId })
      .andWhere('interviews.deleted_at IS NULL')
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

  findCandidateById(
    candidateId: string,
    manager?: EntityManager,
  ): Promise<CandidateEntity | null> {
    return this.repo(this.candidates, manager)
      .createQueryBuilder('candidates')
      .where('candidates.id = :id', { id: candidateId })
      .andWhere('candidates.deleted_at IS NULL')
      .getOne();
  }

  findResumeAnalysisById(
    resumeAnalysisId: string,
    manager?: EntityManager,
  ): Promise<ResumeAiAnalysisEntity | null> {
    return this.repo(this.resumeAnalyses, manager)
      .createQueryBuilder('resume_ai_analyses')
      .where('resume_ai_analyses.id = :id', { id: resumeAnalysisId })
      .andWhere('resume_ai_analyses.deleted_at IS NULL')
      .getOne();
  }

  findLatestCompletedResumeAnalysisByCandidateId(
    candidateId: string,
    manager?: EntityManager,
  ): Promise<ResumeAiAnalysisEntity | null> {
    return this.repo(this.resumeAnalyses, manager)
      .createQueryBuilder('resume_ai_analyses')
      .where('resume_ai_analyses.candidate_id = :candidateId', { candidateId })
      .andWhere('resume_ai_analyses.deleted_at IS NULL')
      .andWhere('resume_ai_analyses.analysis_status = :status', {
        status: ResumeAiAnalysisStatus.COMPLETED,
      })
      .orderBy('resume_ai_analyses.created_at', 'DESC')
      .addOrderBy('resume_ai_analyses.id', 'ASC')
      .getOne();
  }
}
