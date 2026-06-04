import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CandidateDocumentEntity } from '../../../candidates/entities/candidate-document.entity';

import { CreateResumeAiAnalysisDto } from '../../dto/create-resume-ai-analysis.dto';
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
export class CreateResumeAiAnalysisUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
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

      if (dto.application_id) {
        await this.validationHelper.ensureApplicationBelongsToCandidate({
          applicationId: dto.application_id,
          candidateId: doc.candidate_id,
          manager,
        });
      }

      const existing =
        await this.resumeAiAnalysisRepository.findActiveByCandidateDocumentId(
          doc.id,
          { manager },
        );
      this.validationHelper.ensureNoDuplicateActiveResumeAnalysis(existing);

      const now = new Date();

      const created = await this.resumeAiAnalysisRepository.createAndSave(
        {
          candidate_id: doc.candidate_id,
          candidate_document_id: doc.id,
          application_id: dto.application_id ?? null,
          extracted_text: dto.extracted_text ?? null,
          parsed_resume_json: null,
          skills_extracted: [],
          experience_summary: null,
          education_summary: null,
          project_summary: null,
          certification_summary: null,
          total_experience_years_detected: null,
          ai_fit_score: null,
          analysis_status: ResumeAiAnalysisStatus.PENDING,
          analyzed_at: null,
          failure_reason: null,
          created_by_user_id: actorId,
          updated_by_user_id: actorId,
          deleted_at: null,
          deleted_by_user_id: null,
        },
        { manager },
      );

      // Backward compatibility:
      // If extracted_text is provided, run analysis immediately (create+start behavior).
      if (dto.extracted_text && String(dto.extracted_text).trim()) {
        created.analysis_status = ResumeAiAnalysisStatus.PROCESSING;
        created.updated_by_user_id = actorId;
        created.failure_reason = null;
        await this.resumeAiAnalysisRepository.save(created, { manager });

        try {
          const result = await this.aiProvider.analyzeResume({
            candidateDocumentId: doc.id,
            candidateId: doc.candidate_id,
            applicationId: dto.application_id ?? null,
            extractedText: dto.extracted_text,
          });

          this.validationHelper.ensureAiFitScoreRange(result.ai_fit_score);

          created.extracted_text = result.extracted_text;
          created.parsed_resume_json = result.parsed_resume_json ?? null;
          created.skills_extracted = result.skills_extracted ?? [];
          created.experience_summary = result.experience_summary ?? null;
          created.education_summary = result.education_summary ?? null;
          created.project_summary = result.project_summary ?? null;
          created.certification_summary = result.certification_summary ?? null;
          created.total_experience_years_detected =
            result.total_experience_years_detected !== null &&
            Number.isFinite(Number(result.total_experience_years_detected))
              ? Number(result.total_experience_years_detected).toFixed(2)
              : null;
          created.ai_fit_score = Number(result.ai_fit_score).toFixed(2);
          created.analysis_status = ResumeAiAnalysisStatus.COMPLETED;
          created.analyzed_at = now;
          created.updated_by_user_id = actorId;
          created.failure_reason = null;
        } catch (err) {
          created.analysis_status = ResumeAiAnalysisStatus.FAILED;
          created.updated_by_user_id = actorId;
          created.failure_reason =
            err instanceof Error ? err.message : 'Resume analysis failed';
          created.analyzed_at = null;
        }

        await this.resumeAiAnalysisRepository.save(created, { manager });
      }

      const loaded = await this.resumeAiAnalysisRepository.findById(created.id, {
        manager,
      });

      const result = loaded ?? created;

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.RESUME_AI_ANALYSIS,
          entityId: result.id,
          actionType: ActivityActionType.CREATE,
          actorUserId: actorId,
          oldValues: null,
          newValues: {
            candidate_id: result.candidate_id,
            candidate_document_id: result.candidate_document_id,
            application_id: result.application_id ?? null,
            analysis_status: result.analysis_status,
            analyzed_at: result.analyzed_at ? result.analyzed_at.toISOString() : null,
            ai_fit_score: result.ai_fit_score,
            extracted_text_length:
              typeof result.extracted_text === 'string'
                ? result.extracted_text.length
                : null,
            failure_reason: result.failure_reason ?? null,
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
