import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AiInsightsValidationHelper } from '../../helpers/ai-insights-validation.helper';
import { ResumeAiAnalysisRepository } from '../../repositories/resume-ai-analysis.repository';

import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';

@Injectable()
export class DeleteResumeAiAnalysisUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(options: { id: string; actorUserId?: string }): Promise<void> {
    this.validationHelper.ensureActorUserRequired(options.actorUserId);
    const actorId = options.actorUserId;

    await this.dataSource.transaction(async (manager) => {
      const existing = await this.resumeAiAnalysisRepository.findById(options.id, {
        manager,
      });

      if (!existing) {
        throw new NotFoundException({
          message: 'Resume AI analysis not found',
          code: 'RESUME_AI_ANALYSIS_NOT_FOUND',
        });
      }

      await this.resumeAiAnalysisRepository.softDeleteResumeAnalysis(options.id, {
        actorUserId: actorId,
        manager,
      });

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.RESUME_AI_ANALYSIS,
          entityId: options.id,
          actionType: ActivityActionType.DELETE,
          actorUserId: actorId,
          oldValues: {
            analysis_status: existing.analysis_status,
          },
          newValues: null,
          actionAt: new Date(),
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );
    });
  }
}
