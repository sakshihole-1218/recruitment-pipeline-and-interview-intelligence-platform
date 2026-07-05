import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { FeedbackAiSummaryEntity } from '../../entities/feedback-ai-summary.entity';
import { AiFeedbackSummaryStatus } from '../../enums/ai-feedback-summary-status.enum';
import { AiInsightsValidationHelper } from '../../helpers/ai-insights-validation.helper';
import {
  AI_INSIGHTS_PROVIDER,
  AiInsightsProvider,
} from '../../providers/ai-insights-provider';
import { AiInsightsReferenceRepository } from '../../repositories/ai-insights-reference.repository';
import { FeedbackAiSummaryRepository } from '../../repositories/feedback-ai-summary.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';

@Injectable()
export class RegenerateFeedbackAiSummaryUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly feedbackAiSummaryRepository: FeedbackAiSummaryRepository,
    private readonly referenceRepository: AiInsightsReferenceRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
    @Inject(AI_INSIGHTS_PROVIDER)
    private readonly aiProvider: AiInsightsProvider,
  ) {}

  async execute(options: {
    applicationId: string;
    actorUserId?: string;
  }): Promise<FeedbackAiSummaryEntity> {
    this.validationHelper.ensureActorUserRequired(options.actorUserId);
    const actorId = options.actorUserId;

    return this.dataSource.transaction(async (manager) => {
      await this.validationHelper.ensureApplicationExists({
        applicationId: options.applicationId,
        manager,
      });

      const existing =
        await this.feedbackAiSummaryRepository.findActiveByApplicationId(
          options.applicationId,
          { manager },
        );

      if (!existing) {
        throw new NotFoundException({
          message: 'Feedback AI summary not found for this application',
          code: 'FEEDBACK_AI_SUMMARY_NOT_FOUND',
        });
      }

      const oldValues = {
        final_ai_recommendation: existing.final_ai_recommendation,
        generated_at: existing.generated_at
          ? existing.generated_at.toISOString()
          : null,
        generation_status: existing.generation_status ?? null,
      };

      const feedbacks =
        await this.referenceRepository.listInterviewFeedbackByApplicationId({
          applicationId: options.applicationId,
          manager,
        });

      if (!feedbacks.length) {
        throw new BadRequestException({
          message:
            'Interview feedback must exist before generating feedback AI summary',
          code: 'INTERVIEW_FEEDBACK_REQUIRED',
        });
      }

      const now = new Date();
      existing.generation_status = AiFeedbackSummaryStatus.PROCESSING;
      existing.failure_reason = null;
      existing.generated_at = null;
      existing.updated_by_user_id = actorId;

      await this.feedbackAiSummaryRepository.save(existing, { manager });

      try {
        const result = await this.aiProvider.generateFeedbackSummary({
          applicationId: options.applicationId,
          feedbacks,
        });

        existing.summary_text = result.summary_text;
        existing.strengths_summary = result.strengths_summary ?? null;
        existing.concerns_summary = result.concerns_summary ?? null;
        existing.technical_summary = result.technical_summary ?? null;
        existing.communication_summary = result.communication_summary ?? null;
        existing.overall_score =
          result.overall_score !== null &&
          Number.isFinite(Number(result.overall_score))
            ? Number(result.overall_score).toFixed(2)
            : null;
        existing.technical_score =
          result.technical_score !== null &&
          Number.isFinite(Number(result.technical_score))
            ? Number(result.technical_score).toFixed(2)
            : null;
        existing.communication_score =
          result.communication_score !== null &&
          Number.isFinite(Number(result.communication_score))
            ? Number(result.communication_score).toFixed(2)
            : null;
        existing.problem_solving_score =
          result.problem_solving_score !== null &&
          Number.isFinite(Number(result.problem_solving_score))
            ? Number(result.problem_solving_score).toFixed(2)
            : null;
        existing.culture_fit_score =
          result.culture_fit_score !== null &&
          Number.isFinite(Number(result.culture_fit_score))
            ? Number(result.culture_fit_score).toFixed(2)
            : null;

        existing.final_ai_recommendation = result.final_ai_recommendation;
        existing.generation_status = AiFeedbackSummaryStatus.COMPLETED;
        existing.failure_reason = null;
        existing.generated_at = now;
        existing.updated_by_user_id = actorId;
      } catch (err) {
        existing.generation_status = AiFeedbackSummaryStatus.FAILED;
        existing.updated_by_user_id = actorId;
        existing.failure_reason = err instanceof Error ? err.message : 'Feedback AI summary regeneration failed';
        existing.generated_at = null;
      }

      await this.feedbackAiSummaryRepository.save(existing, { manager });

      const loaded = await this.feedbackAiSummaryRepository.findById(
        existing.id,
        {
          manager,
        },
      );

      const resultEntity = loaded ?? existing;

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.FEEDBACK_AI_SUMMARY,
          entityId: resultEntity.id,
          actionType: ActivityActionType.REGENERATE,
          actorUserId: actorId,
          oldValues,
          newValues: {
            application_id: resultEntity.application_id,
            final_ai_recommendation: resultEntity.final_ai_recommendation,
            generation_status: resultEntity.generation_status,
            generated_at: resultEntity.generated_at
              ? resultEntity.generated_at.toISOString()
              : null,
            failure_reason: resultEntity.failure_reason ?? null,
          },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      return resultEntity;
    });
  }
}
