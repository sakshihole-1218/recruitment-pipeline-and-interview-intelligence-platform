import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { FeedbackGenerationStatus } from '../../../aiInterviewSessions/enums/feedback-generation-status.enum';
import { RegenerateAiInterviewFeedbackDto } from '../../dto/regenerate-ai-interview-feedback.dto';
import { AiInterviewFeedbackEntity } from '../../entities/ai-interview-feedback.entity';
import { AiInterviewFeedbackStatus } from '../../enums/ai-interview-feedback-status.enum';
import { AiInterviewFeedbackValidationHelper } from '../../helpers/ai-interview-feedback-validation.helper';
import {
  AI_INTERVIEW_FEEDBACK_PROVIDER,
  AiInterviewFeedbackProvider,
  GenerateAiInterviewFeedbackOutput,
} from '../../providers/ai-interview-feedback-provider';
import { AiInterviewFeedbackReferenceRepository } from '../../repositories/ai-interview-feedback-reference.repository';
import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class RegenerateAiInterviewFeedbackUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewFeedbackRepository,
    private readonly referenceRepository: AiInterviewFeedbackReferenceRepository,
    private readonly validation: AiInterviewFeedbackValidationHelper,
    @Inject(AI_INTERVIEW_FEEDBACK_PROVIDER)
    private readonly provider: AiInterviewFeedbackProvider,
  ) {}

  async execute(
    dto: RegenerateAiInterviewFeedbackDto,
    actorUserId?: string,
  ): Promise<AiInterviewFeedbackEntity> {
    this.validation.ensureActorUserRequired(actorUserId);
    const actorId = actorUserId;

    return this.dataSource.transaction(async (manager) => {
      const session = await this.referenceRepository.findSessionById(
        dto.ai_interview_session_id,
        { manager, lockForUpdate: true },
      );

      if (!session) {
        throw new NotFoundException({
          message: 'AI interview session not found',
          code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
        });
      }

      this.validation.ensureSessionCompleted(session.session_status);

      const existing = await this.repository.findActiveBySessionId(session.id, {
        manager,
        lockForUpdate: true,
      });

      if (!existing) {
        throw new NotFoundException({
          message: 'AI interview feedback not found for this session',
          code: 'AI_INTERVIEW_FEEDBACK_NOT_FOUND',
        });
      }

      const [application, candidate, questions, transcripts, resumeAnalysis] = await Promise.all([
        this.referenceRepository.findApplicationById(session.application_id, manager),
        this.referenceRepository.findCandidateById(session.candidate_id, manager),
        this.referenceRepository.findQuestionsBySessionId(session.id, manager),
        this.referenceRepository.findTranscriptsBySessionId(session.id, manager),
        session.resume_analysis_id
          ? this.referenceRepository.findResumeAnalysisById(session.resume_analysis_id, manager)
          : this.referenceRepository.findLatestCompletedResumeAnalysisByCandidateId(
              session.candidate_id,
              manager,
            ),
      ]);

      if (!application) {
        throw new NotFoundException({
          message: 'Application not found for AI interview session',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      if (!candidate) {
        throw new NotFoundException({
          message: 'Candidate not found for AI interview session',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      this.validation.ensureTranscriptExists(transcripts);
      this.validation.ensureCandidateTranscriptExists(transcripts);

      existing.feedback_status = AiInterviewFeedbackStatus.PROCESSING;
      existing.failure_reason = null;
      existing.generated_at = null;
      existing.updated_by_user_id = actorId;

      await this.repository.updateFeedback(existing, { manager });
      await this.referenceRepository.updateSessionFeedbackGenerationStatus({
        session,
        status: FeedbackGenerationStatus.PROCESSING,
        actorUserId: actorId,
        manager,
      });

      try {
        const result = await this.provider.generateFeedback({
          session,
          application: {
            id: application.id,
            application_number: application.application_number,
          },
          candidate: {
            id: candidate.id,
            full_name: `${candidate.first_name} ${candidate.last_name}`.trim(),
            current_job_title: candidate.current_job_title,
            current_company: candidate.current_company,
            resume_headline: candidate.resume_headline,
            total_experience_years: candidate.total_experience_years,
          },
          resume_analysis: resumeAnalysis,
          questions,
          transcripts,
        });

        const applied = this.applyResult(existing, result, actorId);
        applied.feedback_status = AiInterviewFeedbackStatus.COMPLETED;
        applied.generated_at = new Date();
        applied.failure_reason = null;

        await this.repository.updateFeedback(applied, { manager });
        await this.referenceRepository.updateSessionFeedbackGenerationStatus({
          session,
          status: FeedbackGenerationStatus.COMPLETED,
          actorUserId: actorId,
          manager,
        });
      } catch (error) {
        existing.feedback_status = AiInterviewFeedbackStatus.FAILED;
        existing.failure_reason =
          error instanceof Error
            ? error.message
            : 'AI interview feedback regeneration failed';
        existing.generated_at = null;
        existing.updated_by_user_id = actorId;

        await this.repository.updateFeedback(existing, { manager });
        await this.referenceRepository.updateSessionFeedbackGenerationStatus({
          session,
          status: FeedbackGenerationStatus.FAILED,
          actorUserId: actorId,
          manager,
        });
      }

      const loaded = await this.repository.findById(existing.id, { manager });
      if (!loaded) {
        throw new BadRequestException({
          message: 'Regenerated AI interview feedback could not be loaded',
          code: 'AI_INTERVIEW_FEEDBACK_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }

  private applyResult(
    entity: AiInterviewFeedbackEntity,
    result: GenerateAiInterviewFeedbackOutput,
    actorUserId: string,
  ): AiInterviewFeedbackEntity {
    const technicalScore = this.normalizeScore(result.technical_score, 'technical_score');
    const communicationScore = this.normalizeScore(
      result.communication_score,
      'communication_score',
    );
    const problemSolvingScore = this.normalizeScore(
      result.problem_solving_score,
      'problem_solving_score',
    );
    const projectUnderstandingScore = this.normalizeScore(
      result.project_understanding_score,
      'project_understanding_score',
    );
    const answerRelevanceScore = this.normalizeScore(
      result.answer_relevance_score,
      'answer_relevance_score',
    );
    const confidenceScore = this.normalizeScore(result.confidence_score, 'confidence_score');
    const overallScore = result.overall_score ?? this.validation.calculateOverallScore([
      technicalScore,
      communicationScore,
      problemSolvingScore,
      projectUnderstandingScore,
      answerRelevanceScore,
      confidenceScore,
    ]);

    this.validation.ensureScoreWithinRange(overallScore, 'overall_score');

    entity.resume_analysis_id = entity.resume_analysis_id ?? null;
    entity.technical_score = technicalScore === null ? null : technicalScore.toFixed(2);
    entity.communication_score =
      communicationScore === null ? null : communicationScore.toFixed(2);
    entity.problem_solving_score =
      problemSolvingScore === null ? null : problemSolvingScore.toFixed(2);
    entity.project_understanding_score =
      projectUnderstandingScore === null ? null : projectUnderstandingScore.toFixed(2);
    entity.answer_relevance_score =
      answerRelevanceScore === null ? null : answerRelevanceScore.toFixed(2);
    entity.confidence_score = confidenceScore === null ? null : confidenceScore.toFixed(2);
    entity.overall_score = overallScore === null ? null : overallScore.toFixed(2);
    entity.technical_summary = this.validation.normalizeText(result.technical_summary);
    entity.communication_summary = this.validation.normalizeText(result.communication_summary);
    entity.problem_solving_summary = this.validation.normalizeText(result.problem_solving_summary);
    entity.project_understanding_summary = this.validation.normalizeText(
      result.project_understanding_summary,
    );
    entity.strengths = this.validation.normalizeText(result.strengths);
    entity.concerns = this.validation.normalizeText(result.concerns);
    entity.improvement_areas = this.validation.normalizeText(result.improvement_areas);
    entity.ai_recommendation =
      result.ai_recommendation ?? this.validation.toRecommendation(overallScore);
    entity.raw_ai_payload = result.raw_ai_payload ?? null;
    entity.updated_by_user_id = actorUserId;

    return entity;
  }

  private normalizeScore(value: number | null | undefined, fieldName: string): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numeric = Number(value);
    this.validation.ensureScoreWithinRange(numeric, fieldName);
    return Number(numeric.toFixed(2));
  }
}