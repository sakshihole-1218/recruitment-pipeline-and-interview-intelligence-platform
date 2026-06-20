import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { ResumeAiAnalysisEntity } from '../../aiInsights/entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisStatus } from '../../aiInsights/enums/resume-ai-analysis-status.enum';
import { AiInterviewQuestionEntity } from '../../aiInterviewQuestions/entities/ai-interview-question.entity';
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';
import { FeedbackGenerationStatus } from '../../aiInterviewSessions/enums/feedback-generation-status.enum';
import { AiInterviewTranscriptEntity } from '../../aiInterviewTranscripts/entities/ai-interview-transcript.entity';

@Injectable()
export class AiInterviewFeedbackReferenceRepository {
  constructor(
    @InjectRepository(AiInterviewSessionEntity)
    private readonly sessions: Repository<AiInterviewSessionEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(CandidateEntity)
    private readonly candidates: Repository<CandidateEntity>,
    @InjectRepository(ResumeAiAnalysisEntity)
    private readonly resumeAnalyses: Repository<ResumeAiAnalysisEntity>,
    @InjectRepository(AiInterviewQuestionEntity)
    private readonly questions: Repository<AiInterviewQuestionEntity>,
    @InjectRepository(AiInterviewTranscriptEntity)
    private readonly transcripts: Repository<AiInterviewTranscriptEntity>,
  ) {}

  private repo<T extends ObjectLiteral>(
    repo: Repository<T>,
    manager?: EntityManager,
  ): Repository<T> {
    return manager ? manager.getRepository<T>(repo.target as any) : repo;
  }

  findSessionById(
    sessionId: string,
    options?: { manager?: EntityManager; lockForUpdate?: boolean },
  ): Promise<AiInterviewSessionEntity | null> {
    const qb = this.repo(this.sessions, options?.manager)
      .createQueryBuilder('ai_interview_sessions')
      .where('ai_interview_sessions.id = :id', { id: sessionId })
      .andWhere('ai_interview_sessions.deleted_at IS NULL');

    if (options?.lockForUpdate) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  updateSession(
    entity: AiInterviewSessionEntity,
    manager?: EntityManager,
  ): Promise<AiInterviewSessionEntity> {
    return this.repo(this.sessions, manager).save(entity);
  }

  async updateSessionFeedbackGenerationStatus(options: {
    session: AiInterviewSessionEntity;
    status: FeedbackGenerationStatus;
    actorUserId?: string;
    manager?: EntityManager;
  }): Promise<AiInterviewSessionEntity> {
    options.session.feedback_generation_status = options.status;
    options.session.updated_by_user_id = options.actorUserId ?? null;
    return this.updateSession(options.session, options.manager);
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

  findQuestionsBySessionId(
    sessionId: string,
    manager?: EntityManager,
  ): Promise<AiInterviewQuestionEntity[]> {
    return this.repo(this.questions, manager)
      .createQueryBuilder('ai_interview_questions')
      .where('ai_interview_questions.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .andWhere('ai_interview_questions.deleted_at IS NULL')
      .orderBy('ai_interview_questions.sequence_number', 'ASC')
      .addOrderBy('ai_interview_questions.created_at', 'ASC')
      .getMany();
  }

  findTranscriptsBySessionId(
    sessionId: string,
    manager?: EntityManager,
  ): Promise<AiInterviewTranscriptEntity[]> {
    return this.repo(this.transcripts, manager)
      .createQueryBuilder('ai_interview_transcripts')
      .where('ai_interview_transcripts.ai_interview_session_id = :sessionId', {
        sessionId,
      })
      .andWhere('ai_interview_transcripts.deleted_at IS NULL')
      .orderBy('ai_interview_transcripts.sequence_number', 'ASC')
      .addOrderBy('ai_interview_transcripts.created_at', 'ASC')
      .getMany();
  }
}
