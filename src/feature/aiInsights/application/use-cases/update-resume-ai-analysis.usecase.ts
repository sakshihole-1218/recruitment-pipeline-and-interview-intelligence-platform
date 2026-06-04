import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateResumeAiAnalysisDto } from '../../dto/update-resume-ai-analysis.dto';
import { ResumeAiAnalysisEntity } from '../../entities/resume-ai-analysis.entity';
import { AiInsightsValidationHelper } from '../../helpers/ai-insights-validation.helper';
import { ResumeAiAnalysisRepository } from '../../repositories/resume-ai-analysis.repository';

import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';

@Injectable()
export class UpdateResumeAiAnalysisUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(options: {
    id: string;
    dto: UpdateResumeAiAnalysisDto;
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

      if (options.dto.ai_fit_score !== undefined) {
        this.validationHelper.ensureAiFitScoreRange(options.dto.ai_fit_score);
      }

      const oldValues = {
        analysis_status: entity.analysis_status,
        analyzed_at: entity.analyzed_at ? entity.analyzed_at.toISOString() : null,
        ai_fit_score: entity.ai_fit_score,
      };

      if (options.dto.extracted_text !== undefined)
        entity.extracted_text = options.dto.extracted_text;
      if (options.dto.parsed_resume_json !== undefined)
        entity.parsed_resume_json = options.dto.parsed_resume_json;
      if (options.dto.skills_extracted !== undefined)
        entity.skills_extracted = options.dto.skills_extracted;
      if (options.dto.experience_summary !== undefined)
        entity.experience_summary = options.dto.experience_summary;
      if (options.dto.education_summary !== undefined)
        entity.education_summary = options.dto.education_summary;
      if (options.dto.project_summary !== undefined)
        entity.project_summary = options.dto.project_summary;
      if (options.dto.certification_summary !== undefined)
        entity.certification_summary = options.dto.certification_summary;
      if (options.dto.total_experience_years_detected !== undefined)
        entity.total_experience_years_detected =
          Number.isFinite(Number(options.dto.total_experience_years_detected))
            ? Number(options.dto.total_experience_years_detected).toFixed(2)
            : null;
      if (options.dto.ai_fit_score !== undefined)
        entity.ai_fit_score = Number(options.dto.ai_fit_score).toFixed(2);
      if (options.dto.analysis_status !== undefined)
        entity.analysis_status = options.dto.analysis_status;
      if (options.dto.failure_reason !== undefined)
        entity.failure_reason = options.dto.failure_reason;

      entity.updated_by_user_id = actorId;

      await this.resumeAiAnalysisRepository.save(entity, { manager });

      const loaded =
        (await this.resumeAiAnalysisRepository.findById(entity.id, { manager })) ??
        entity;

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.RESUME_AI_ANALYSIS,
          entityId: loaded.id,
          actionType: ActivityActionType.UPDATE,
          actorUserId: actorId,
          oldValues,
          newValues: {
            analysis_status: loaded.analysis_status,
            analyzed_at: loaded.analyzed_at ? loaded.analyzed_at.toISOString() : null,
            ai_fit_score: loaded.ai_fit_score,
            failure_reason: loaded.failure_reason ?? null,
          },
          actionAt: new Date(),
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      return loaded;
    });
  }
}
