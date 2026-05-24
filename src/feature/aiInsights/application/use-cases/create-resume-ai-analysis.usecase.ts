import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CandidateDocumentEntity } from '../../../candidates/entities/candidate-document.entity';

import { CreateResumeAiAnalysisDto } from '../../dto/create-resume-ai-analysis.dto';
import { ResumeAiAnalysisEntity } from '../../entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisStatus } from '../../enums/resume-ai-analysis-status.enum';
import { AiInsightsValidationHelper } from '../../helpers/ai-insights-validation.helper';
import { AI_INSIGHTS_PROVIDER, AiInsightsProvider } from '../../providers/ai-insights-provider';
import { ResumeAiAnalysisRepository } from '../../repositories/resume-ai-analysis.repository';

@Injectable()
export class CreateResumeAiAnalysisUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    @Inject(AI_INSIGHTS_PROVIDER)
    private readonly aiProvider: AiInsightsProvider,
  ) {}

  async execute(
    dto: CreateResumeAiAnalysisDto,
    actorUserId?: string,
  ): Promise<ResumeAiAnalysisEntity> {
    this.validationHelper.ensureActorUserRequired(actorUserId);
    const actorId = actorUserId;

    return this.dataSource.transaction(async (manager) => {
      const doc: CandidateDocumentEntity =
        await this.validationHelper.ensureCandidateDocumentIsResume({
          candidateDocumentId: dto.candidate_document_id,
          manager,
        });

      const existing =
        await this.resumeAiAnalysisRepository.findActiveByCandidateDocumentId(
          doc.id,
          { manager },
        );
      this.validationHelper.ensureNoDuplicateActiveResumeAnalysis(existing);

      const now = new Date();

      const created = await this.resumeAiAnalysisRepository.createAndSave(
        {
          candidate_document_id: doc.id,
          extracted_text: dto.extracted_text,
          skills_extracted: [],
          experience_summary: null,
          education_summary: null,
          ai_fit_score: null,
          analysis_status: ResumeAiAnalysisStatus.PROCESSING,
          analyzed_at: null,
          created_by_user_id: actorId,
          updated_by_user_id: actorId,
          deleted_at: null,
          deleted_by_user_id: null,
        },
        { manager },
      );

      try {
        const result = await this.aiProvider.analyzeResumeText(dto.extracted_text);
        this.validationHelper.ensureAiFitScoreRange(result.ai_fit_score);

        created.skills_extracted = result.skills_extracted ?? [];
        created.experience_summary = result.experience_summary ?? null;
        created.education_summary = result.education_summary ?? null;
        created.ai_fit_score = Number(result.ai_fit_score).toFixed(2);
        created.analysis_status = ResumeAiAnalysisStatus.COMPLETED;
        created.analyzed_at = now;
        created.updated_by_user_id = actorId;
      } catch {
        created.analysis_status = ResumeAiAnalysisStatus.FAILED;
        created.updated_by_user_id = actorId;
      }

      await this.resumeAiAnalysisRepository.save(created, { manager });

      const loaded = await this.resumeAiAnalysisRepository.findById(created.id, {
        manager,
      });

      return loaded ?? created;
    });
  }
}
