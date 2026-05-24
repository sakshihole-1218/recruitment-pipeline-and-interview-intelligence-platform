import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { EntityManager } from 'typeorm';

import { CandidateDocumentType } from '../../candidates/enums/candidate-document-type.enum';

import { AiInsightsReferenceRepository } from '../repositories/ai-insights-reference.repository';
import { ResumeAiAnalysisEntity } from '../entities/resume-ai-analysis.entity';
import { FeedbackAiSummaryEntity } from '../entities/feedback-ai-summary.entity';

@Injectable()
export class AiInsightsValidationHelper {
  constructor(
    private readonly referenceRepository: AiInsightsReferenceRepository,
  ) {}

  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureAiFitScoreRange(score: number): void {
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new BadRequestException({
        message: 'ai_fit_score must be between 0 and 100',
        code: 'INVALID_AI_FIT_SCORE',
      });
    }
  }

  ensureExtractedTextAvailable(text?: string | null): asserts text is string {
    if (!text || !String(text).trim()) {
      throw new BadRequestException({
        message: 'extracted_text is required to run resume analysis',
        code: 'EXTRACTED_TEXT_REQUIRED',
      });
    }
  }

  async ensureCandidateDocumentIsResume(options: {
    candidateDocumentId: string;
    manager: EntityManager;
  }) {
    const doc = await this.referenceRepository.findCandidateDocumentById(
      options.candidateDocumentId,
      options.manager,
    );

    if (!doc) {
      throw new BadRequestException({
        message: 'Candidate document not found',
        code: 'CANDIDATE_DOCUMENT_NOT_FOUND',
      });
    }

    if (doc.document_type !== CandidateDocumentType.RESUME) {
      throw new ConflictException({
        message: 'Only RESUME type candidate documents can be analyzed',
        code: 'CANDIDATE_DOCUMENT_NOT_RESUME',
      });
    }

    return doc;
  }

  async ensureApplicationExists(options: {
    applicationId: string;
    manager: EntityManager;
  }) {
    const app = await this.referenceRepository.findApplicationById(
      options.applicationId,
      options.manager,
    );

    if (!app) {
      throw new BadRequestException({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND',
      });
    }

    return app;
  }

  ensureNoDuplicateActiveResumeAnalysis(existing: ResumeAiAnalysisEntity | null): void {
    if (existing) {
      throw new ConflictException({
        message:
          'An active resume AI analysis already exists for this candidate document. Use regenerate endpoint to update it.',
        code: 'DUPLICATE_ACTIVE_RESUME_AI_ANALYSIS',
      });
    }
  }

  ensureNoDuplicateActiveFeedbackSummary(existing: FeedbackAiSummaryEntity | null): void {
    if (existing) {
      throw new ConflictException({
        message:
          'An active feedback AI summary already exists for this application. Use regenerate endpoint to update it.',
        code: 'DUPLICATE_ACTIVE_FEEDBACK_AI_SUMMARY',
      });
    }
  }
}
