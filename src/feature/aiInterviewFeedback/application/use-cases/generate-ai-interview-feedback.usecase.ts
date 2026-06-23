import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { FeedbackGenerationStatus } from '../../../aiInterviewSessions/enums/feedback-generation-status.enum';
import { AiInterviewFeedbackEntity } from '../../entities/ai-interview-feedback.entity';
import { AiInterviewFeedbackStatus } from '../../enums/ai-interview-feedback-status.enum';
import { AiInterviewFeedbackValidationHelper } from '../../helpers/ai-interview-feedback-validation.helper';
import {
  AI_INTERVIEW_FEEDBACK_PROVIDER,
  GenerateAiInterviewFeedbackOutput,
  InterviewEvaluationProvider,
} from '../../providers/ai-interview-feedback-provider';
import { AiInterviewFeedbackReferenceRepository } from '../../repositories/ai-interview-feedback-reference.repository';
import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class GenerateAiInterviewFeedbackUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewFeedbackRepository,
    private readonly referenceRepository: AiInterviewFeedbackReferenceRepository,
    private readonly validation: AiInterviewFeedbackValidationHelper,
    @Inject(AI_INTERVIEW_FEEDBACK_PROVIDER)
    private readonly provider: InterviewEvaluationProvider,
  ) {}

  async execute(
    sessionId: string,
    actorUserId?: string,
  ): Promise<AiInterviewFeedbackEntity> {
    this.validation.ensureActorUserRequired(actorUserId);
    const actorId = actorUserId;

    return this.dataSource.transaction(async (manager) => {
      const session = await this.referenceRepository.findSessionById(sessionId, {
        manager,
        lockForUpdate: true,
      });

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
      this.validation.ensureNoDuplicateActiveFeedback(existing);

      const [application, candidate, allQuestions, transcripts, resumeAnalysis] =
        await Promise.all([
          this.referenceRepository.findApplicationById(
            session.application_id,
            manager,
          ),
          this.referenceRepository.findCandidateById(session.candidate_id, manager),
          this.referenceRepository.findQuestionsBySessionId(session.id, manager),
          this.referenceRepository.findTranscriptsBySessionId(session.id, manager),
          session.resume_analysis_id
            ? this.referenceRepository.findResumeAnalysisById(
                session.resume_analysis_id,
                manager,
              )
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
      this.validation.ensureMinimumCandidateTranscriptLength(transcripts);

      const questions = allQuestions.filter((question) => !question.is_follow_up);
      const followUps = allQuestions.filter((question) => question.is_follow_up);

      await this.referenceRepository.updateSessionFeedbackGenerationStatus({
        session,
        status: FeedbackGenerationStatus.PROCESSING,
        actorUserId: actorId,
        manager,
      });

      const created = await this.repository.createFeedback(
        {
          ai_interview_session_id: session.id,
          application_id: session.application_id,
          candidate_id: session.candidate_id,
          resume_analysis_id: resumeAnalysis?.id ?? null,
          technical_score: null,
          communication_score: null,
          problem_solving_score: null,
          experience_relevance_score: null,
          overall_score: null,
          strengths_summary: null,
          weaknesses_summary: null,
          detailed_feedback: null,
          technical_summary: null,
          communication_summary: null,
          problem_solving_summary: null,
          experience_relevance_summary: null,
          recommendation: null,
          feedback_status: AiInterviewFeedbackStatus.PROCESSING,
          generated_at: null,
          failure_reason: null,
          evaluation_metadata: null,
          created_by_user_id: actorId,
          updated_by_user_id: actorId,
          deleted_at: null,
          deleted_by_user_id: null,
        },
        { manager },
      );

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
          follow_ups: followUps,
          transcripts,
        });

        const applied = this.applyResult(created, result, actorId);
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
        created.feedback_status = AiInterviewFeedbackStatus.FAILED;
        created.failure_reason =
          error instanceof Error
            ? error.message
            : 'AI interview feedback generation failed';
        created.generated_at = null;
        created.updated_by_user_id = actorId;

        await this.repository.updateFeedback(created, { manager });
        await this.referenceRepository.updateSessionFeedbackGenerationStatus({
          session,
          status: FeedbackGenerationStatus.FAILED,
          actorUserId: actorId,
          manager,
        });
      }

      const loaded = await this.repository.findById(created.id, { manager });
      if (!loaded) {
        throw new BadRequestException({
          message: 'Generated AI interview feedback could not be loaded',
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
    const technicalScore = this.normalizeScore(
      result.technical_score,
      'technical_score',
    );
    const communicationScore = this.normalizeScore(
      result.communication_score,
      'communication_score',
    );
    const problemSolvingScore = this.normalizeScore(
      result.problem_solving_score,
      'problem_solving_score',
    );
    const experienceRelevanceScore = this.normalizeScore(
      result.experience_relevance_score,
      'experience_relevance_score',
    );
    const overallScore =
      result.overall_score ??
      this.validation.calculateOverallScore([
        technicalScore,
        communicationScore,
        problemSolvingScore,
        experienceRelevanceScore,
      ]);

    this.validation.ensureOverallScoreWithinRange(
      overallScore,
      'overall_score',
    );

    entity.technical_score =
      technicalScore === null ? null : technicalScore.toFixed(2);
    entity.communication_score =
      communicationScore === null ? null : communicationScore.toFixed(2);
    entity.problem_solving_score =
      problemSolvingScore === null ? null : problemSolvingScore.toFixed(2);
    entity.experience_relevance_score =
      experienceRelevanceScore === null
        ? null
        : experienceRelevanceScore.toFixed(2);
    entity.overall_score =
      overallScore === null ? null : overallScore.toFixed(2);
    entity.strengths_summary = this.validation.normalizeText(
      result.strengths_summary,
    );
    entity.weaknesses_summary = this.validation.normalizeText(
      result.weaknesses_summary,
    );
    entity.detailed_feedback = this.validation.normalizeText(
      result.detailed_feedback,
    );
    entity.technical_summary = this.validation.normalizeText(
      result.technical_summary,
    );
    entity.communication_summary = this.validation.normalizeText(
      result.communication_summary,
    );
    entity.problem_solving_summary = this.validation.normalizeText(
      result.problem_solving_summary,
    );
    entity.experience_relevance_summary = this.validation.normalizeText(
      result.experience_relevance_summary,
    );
    entity.recommendation =
      result.recommendation ?? this.validation.toRecommendation(overallScore);
    entity.evaluation_metadata = result.evaluation_metadata ?? null;
    entity.updated_by_user_id = actorUserId;

    return entity;
  }

  private normalizeScore(
    value: number | null | undefined,
    fieldName: string,
  ): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numeric = Number(value);
    this.validation.ensureScoreWithinRange(numeric, fieldName);
    return Number(numeric.toFixed(2));
  }
}
