import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AiInsightsValidationHelper } from '../../helpers/ai-insights-validation.helper';
import { FeedbackAiSummaryRepository } from '../../repositories/feedback-ai-summary.repository';

import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';

@Injectable()
export class DeleteFeedbackAiSummaryUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly feedbackAiSummaryRepository: FeedbackAiSummaryRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(options: { id: string; actorUserId?: string }): Promise<void> {
    this.validationHelper.ensureActorUserRequired(options.actorUserId);
    const actorId = options.actorUserId;

    await this.dataSource.transaction(async (manager) => {
      const existing = await this.feedbackAiSummaryRepository.findById(options.id, {
        manager,
      });

      if (!existing) {
        throw new NotFoundException({
          message: 'Feedback AI summary not found',
          code: 'FEEDBACK_AI_SUMMARY_NOT_FOUND',
        });
      }

      await this.feedbackAiSummaryRepository.softDeleteFeedbackSummary(options.id, {
        actorUserId: actorId,
        manager,
      });

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.FEEDBACK_AI_SUMMARY,
          entityId: options.id,
          actionType: ActivityActionType.DELETE,
          actorUserId: actorId,
          oldValues: {
            generation_status: existing.generation_status ?? null,
            final_ai_recommendation: existing.final_ai_recommendation,
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
