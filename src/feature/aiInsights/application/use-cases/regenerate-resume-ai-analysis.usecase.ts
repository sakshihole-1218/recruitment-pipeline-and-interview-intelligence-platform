import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { RegenerateResumeAiAnalysisDto } from '../../dto/regenerate-resume-ai-analysis.dto';
import { ResumeAiAnalysisEntity } from '../../entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisStatus } from '../../enums/resume-ai-analysis-status.enum';
import { AiInsightsValidationHelper } from '../../helpers/ai-insights-validation.helper';
import {
  AI_INSIGHTS_PROVIDER,
  AiInsightsProvider,
} from '../../providers/ai-insights-provider';
import { ResumeAiAnalysisRepository } from '../../repositories/resume-ai-analysis.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';

@Injectable()
export class RegenerateResumeAiAnalysisUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
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

      const oldValues = {
        analysis_status: existing.analysis_status,
        analyzed_at: existing.analyzed_at
          ? existing.analyzed_at.toISOString()
          : null,
        ai_fit_score: existing.ai_fit_score,
      };

      const extractedTextChanged =
        typeof options.dto.extracted_text === 'string' &&
        options.dto.extracted_text !== existing.extracted_text;

      const extractedText =
        options.dto.extracted_text ?? existing.extracted_text;

      existing.analysis_status = ResumeAiAnalysisStatus.PROCESSING;
      existing.updated_by_user_id = actorId;
      existing.failure_reason = null;

      await this.resumeAiAnalysisRepository.save(existing, { manager });

      const now = new Date();

      try {
        const result = await this.aiProvider.analyzeResume({
          candidateDocumentId: existing.candidate_document_id,
          candidateId: existing.candidate_id,
          applicationId: existing.application_id ?? null,
          extractedText: extractedText ?? null,
        });

        this.validationHelper.ensureAiFitScoreRange(result.ai_fit_score);

        existing.extracted_text = result.extracted_text;
        existing.parsed_resume_json = result.parsed_resume_json ?? null;
        existing.skills_extracted = result.skills_extracted ?? [];
        existing.experience_summary = result.experience_summary ?? null;
        existing.education_summary = result.education_summary ?? null;
        existing.project_summary = result.project_summary ?? null;
        existing.certification_summary = result.certification_summary ?? null;
        existing.total_experience_years_detected =
          result.total_experience_years_detected !== null &&
          Number.isFinite(Number(result.total_experience_years_detected))
            ? Number(result.total_experience_years_detected).toFixed(2)
            : null;
        existing.ai_fit_score = Number(result.ai_fit_score).toFixed(2);
        existing.analysis_status = ResumeAiAnalysisStatus.COMPLETED;
        existing.analyzed_at = now;
        existing.updated_by_user_id = actorId;
        existing.failure_reason = null;
      } catch {
        existing.analysis_status = ResumeAiAnalysisStatus.FAILED;
        existing.updated_by_user_id = actorId;
        existing.failure_reason = 'Resume analysis regeneration failed';
        existing.analyzed_at = null;
      }

      await this.resumeAiAnalysisRepository.save(existing, { manager });

      const loaded = await this.resumeAiAnalysisRepository.findById(
        existing.id,
        {
          manager,
        },
      );

      const result = loaded ?? existing;

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.RESUME_AI_ANALYSIS,
          entityId: result.id,
          actionType: ActivityActionType.REGENERATE,
          actorUserId: actorId,
          oldValues,
          newValues: {
            candidate_document_id: result.candidate_document_id,
            analysis_status: result.analysis_status,
            analyzed_at: result.analyzed_at
              ? result.analyzed_at.toISOString()
              : null,
            ai_fit_score: result.ai_fit_score,
            extracted_text_changed: extractedTextChanged,
            skills_extracted_count: Array.isArray(result.skills_extracted)
              ? result.skills_extracted.length
              : null,
          },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      return result;
    });
  }
}
