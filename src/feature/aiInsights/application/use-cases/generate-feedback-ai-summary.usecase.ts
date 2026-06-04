import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GenerateFeedbackAiSummaryDto } from '../../dto/generate-feedback-ai-summary.dto';
import { FeedbackAiSummaryEntity } from '../../entities/feedback-ai-summary.entity';
import { AiFeedbackSummaryStatus } from '../../enums/ai-feedback-summary-status.enum';
import { FinalAiRecommendation } from '../../enums/final-ai-recommendation.enum';
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
export class GenerateFeedbackAiSummaryUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly feedbackAiSummaryRepository: FeedbackAiSummaryRepository,
    private readonly referenceRepository: AiInsightsReferenceRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
    @Inject(AI_INSIGHTS_PROVIDER)
    private readonly aiProvider: AiInsightsProvider,
  ) {}

  async execute(
    dto: GenerateFeedbackAiSummaryDto,
    actorUserId?: string,
  ): Promise<FeedbackAiSummaryEntity> {
    this.validationHelper.ensureActorUserRequired(actorUserId);
    const actorId = actorUserId;

    return this.dataSource.transaction(async (manager) => {
      await this.validationHelper.ensureApplicationExists({
        applicationId: dto.application_id,
        manager,
      });

      const existing =
        await this.feedbackAiSummaryRepository.findActiveByApplicationId(
          dto.application_id,
          { manager },
        );
      this.validationHelper.ensureNoDuplicateActiveFeedbackSummary(existing);

      const feedbacks =
        await this.referenceRepository.listInterviewFeedbackByApplicationId({
          applicationId: dto.application_id,
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

      
      const created = await this.feedbackAiSummaryRepository.createAndSave(
        {
          application_id: dto.application_id,
          summary_text: 'Feedback AI summary generation in progress',
          strengths_summary: null,
          concerns_summary: null,
          technical_summary: null,
          communication_summary: null,
          overall_score: null,
          technical_score: null,
          communication_score: null,
          problem_solving_score: null,
          culture_fit_score: null,
          final_ai_recommendation: FinalAiRecommendation.HOLD,
          generation_status: AiFeedbackSummaryStatus.PROCESSING,
          failure_reason: null,
          generated_at: null,
          created_by_user_id: actorId,
          updated_by_user_id: actorId,
          deleted_at: null,
          deleted_by_user_id: null,
        },
        { manager },
      );

      try {
        const result = await this.aiProvider.generateFeedbackSummary({
          applicationId: dto.application_id,
          feedbacks,
        });

        created.summary_text = result.summary_text;
        created.strengths_summary = result.strengths_summary ?? null;
        created.concerns_summary = result.concerns_summary ?? null;
        created.technical_summary = result.technical_summary ?? null;
        created.communication_summary = result.communication_summary ?? null;
        created.overall_score =
          result.overall_score !== null && Number.isFinite(Number(result.overall_score))
            ? Number(result.overall_score).toFixed(2)
            : null;
        created.technical_score =
          result.technical_score !== null && Number.isFinite(Number(result.technical_score))
            ? Number(result.technical_score).toFixed(2)
            : null;
        created.communication_score =
          result.communication_score !== null &&
          Number.isFinite(Number(result.communication_score))
            ? Number(result.communication_score).toFixed(2)
            : null;
        created.problem_solving_score =
          result.problem_solving_score !== null &&
          Number.isFinite(Number(result.problem_solving_score))
            ? Number(result.problem_solving_score).toFixed(2)
            : null;
        created.culture_fit_score =
          result.culture_fit_score !== null &&
          Number.isFinite(Number(result.culture_fit_score))
            ? Number(result.culture_fit_score).toFixed(2)
            : null;

        created.final_ai_recommendation = result.final_ai_recommendation;
        created.generation_status = AiFeedbackSummaryStatus.COMPLETED;
        created.failure_reason = null;
        created.generated_at = now;
        created.updated_by_user_id = actorId;
      } catch (err) {
        created.generation_status = AiFeedbackSummaryStatus.FAILED;
        created.failure_reason =
          err instanceof Error ? err.message : 'Feedback summary generation failed';
        created.generated_at = null;
        created.updated_by_user_id = actorId;
      }

      await this.feedbackAiSummaryRepository.save(created, { manager });

      const loaded = await this.feedbackAiSummaryRepository.findById(created.id, {
        manager,
      });

      const resultEntity = loaded ?? created;

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.FEEDBACK_AI_SUMMARY,
          entityId: resultEntity.id,
          actionType: ActivityActionType.GENERATE,
          actorUserId: actorId,
          oldValues: null,
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
