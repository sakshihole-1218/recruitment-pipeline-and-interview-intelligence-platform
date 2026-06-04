import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

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
export class StartResumeAiAnalysisUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
    @Inject(AI_INSIGHTS_PROVIDER)
    private readonly aiProvider: AiInsightsProvider,
  ) {}

  async execute(options: {
    id: string;
    actorUserId?: string;
  }): Promise<ResumeAiAnalysisEntity> {
    this.validationHelper.ensureActorUserRequired(options.actorUserId);
    const actorId = options.actorUserId;

    return this.dataSource.transaction(async (manager) => {
      const entity = await this.resumeAiAnalysisRepository.findById(options.id, {
        manager,
      });

      if (!entity) {
        throw new NotFoundException({
          message: 'Resume AI analysis not found',
          code: 'RESUME_AI_ANALYSIS_NOT_FOUND',
        });
      }

      const oldValues = {
        analysis_status: entity.analysis_status,
        analyzed_at: entity.analyzed_at ? entity.analyzed_at.toISOString() : null,
        ai_fit_score: entity.ai_fit_score,
      };

      entity.analysis_status = ResumeAiAnalysisStatus.PROCESSING;
      entity.failure_reason = null;
      entity.updated_by_user_id = actorId;
      await this.resumeAiAnalysisRepository.save(entity, { manager });

      const now = new Date();

      try {
        const result = await this.aiProvider.analyzeResume({
          candidateDocumentId: entity.candidate_document_id,
          candidateId: entity.candidate_id,
          applicationId: entity.application_id ?? null,
          extractedText: entity.extracted_text ?? null,
        });

        this.validationHelper.ensureAiFitScoreRange(result.ai_fit_score);

        entity.extracted_text = result.extracted_text;
        entity.parsed_resume_json = result.parsed_resume_json ?? null;
        entity.skills_extracted = result.skills_extracted ?? [];
        entity.experience_summary = result.experience_summary ?? null;
        entity.education_summary = result.education_summary ?? null;
        entity.project_summary = result.project_summary ?? null;
        entity.certification_summary = result.certification_summary ?? null;
        entity.total_experience_years_detected =
          result.total_experience_years_detected !== null &&
          Number.isFinite(Number(result.total_experience_years_detected))
            ? Number(result.total_experience_years_detected).toFixed(2)
            : null;
        entity.ai_fit_score = Number(result.ai_fit_score).toFixed(2);
        entity.analysis_status = ResumeAiAnalysisStatus.COMPLETED;
        entity.analyzed_at = now;
        entity.failure_reason = null;
        entity.updated_by_user_id = actorId;
      } catch (err) {
        entity.analysis_status = ResumeAiAnalysisStatus.FAILED;
        entity.analyzed_at = null;
        entity.failure_reason =
          err instanceof Error ? err.message : 'Resume analysis start failed';
        entity.updated_by_user_id = actorId;
      }

      await this.resumeAiAnalysisRepository.save(entity, { manager });

      const loaded =
        (await this.resumeAiAnalysisRepository.findById(entity.id, { manager })) ??
        entity;

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.RESUME_AI_ANALYSIS,
          entityId: loaded.id,
          actionType: ActivityActionType.GENERATE,
          actorUserId: actorId,
          oldValues,
          newValues: {
            analysis_status: loaded.analysis_status,
            analyzed_at: loaded.analyzed_at ? loaded.analyzed_at.toISOString() : null,
            ai_fit_score: loaded.ai_fit_score,
            failure_reason: loaded.failure_reason ?? null,
          },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      return loaded;
    });
  }
}
