import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { RegenerateResumeAiAnalysisDto } from '../../dto/regenerate-resume-ai-analysis.dto';
import { ResumeAiAnalysisEntity } from '../../entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisStatus } from '../../enums/resume-ai-analysis-status.enum';
import { AiInsightsValidationHelper } from '../../helpers/ai-insights-validation.helper';
import { AI_INSIGHTS_PROVIDER, AiInsightsProvider } from '../../providers/ai-insights-provider';
import { ResumeAiAnalysisRepository } from '../../repositories/resume-ai-analysis.repository';

@Injectable()
export class RegenerateResumeAiAnalysisUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    @Inject(AI_INSIGHTS_PROVIDER)
    private readonly aiProvider: AiInsightsProvider,
  ) {}

  async execute(options: {
    candidateDocumentId: string;
    dto: RegenerateResumeAiAnalysisDto;
    actorUserId?: string;
  }): Promise<ResumeAiAnalysisEntity> {
    this.validationHelper.ensureActorUserRequired(options.actorUserId);
    const actorId = options.actorUserId;

    return this.dataSource.transaction(async (manager) => {
      const existing =
        await this.resumeAiAnalysisRepository.findActiveByCandidateDocumentId(
          options.candidateDocumentId,
          { manager },
        );

      if (!existing) {
        throw new NotFoundException({
          message: 'Resume AI analysis not found for this candidate document',
          code: 'RESUME_AI_ANALYSIS_NOT_FOUND',
        });
      }

      const extractedText = options.dto.extracted_text ?? existing.extracted_text;
      this.validationHelper.ensureExtractedTextAvailable(extractedText);

      existing.analysis_status = ResumeAiAnalysisStatus.PROCESSING;
      existing.updated_by_user_id = actorId;

      await this.resumeAiAnalysisRepository.save(existing, { manager });

      const now = new Date();

      try {
        const result = await this.aiProvider.analyzeResumeText(extractedText);
        this.validationHelper.ensureAiFitScoreRange(result.ai_fit_score);

        existing.extracted_text = extractedText;
        existing.skills_extracted = result.skills_extracted ?? [];
        existing.experience_summary = result.experience_summary ?? null;
        existing.education_summary = result.education_summary ?? null;
        existing.ai_fit_score = Number(result.ai_fit_score).toFixed(2);
        existing.analysis_status = ResumeAiAnalysisStatus.COMPLETED;
        existing.analyzed_at = now;
        existing.updated_by_user_id = actorId;
      } catch {
        existing.analysis_status = ResumeAiAnalysisStatus.FAILED;
        existing.updated_by_user_id = actorId;
      }

      await this.resumeAiAnalysisRepository.save(existing, { manager });

      const loaded = await this.resumeAiAnalysisRepository.findById(existing.id, {
        manager,
      });
      return loaded ?? existing;
    });
  }
}
