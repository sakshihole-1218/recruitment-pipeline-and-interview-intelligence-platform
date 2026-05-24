import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GenerateFeedbackAiSummaryDto } from '../../dto/generate-feedback-ai-summary.dto';
import { FeedbackAiSummaryEntity } from '../../entities/feedback-ai-summary.entity';
import { AiInsightsValidationHelper } from '../../helpers/ai-insights-validation.helper';
import {
  AI_INSIGHTS_PROVIDER,
  AiInsightsProvider,
} from '../../providers/ai-insights-provider';
import { AiInsightsReferenceRepository } from '../../repositories/ai-insights-reference.repository';
import { FeedbackAiSummaryRepository } from '../../repositories/feedback-ai-summary.repository';

@Injectable()
export class GenerateFeedbackAiSummaryUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly feedbackAiSummaryRepository: FeedbackAiSummaryRepository,
    private readonly referenceRepository: AiInsightsReferenceRepository,
    private readonly validationHelper: AiInsightsValidationHelper,
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
      const result = await this.aiProvider.summarizeInterviewFeedback({
        applicationId: dto.application_id,
        feedbacks,
      });

      const created = await this.feedbackAiSummaryRepository.createAndSave(
        {
          application_id: dto.application_id,
          summary_text: result.summary_text,
          strengths_summary: result.strengths_summary ?? null,
          concerns_summary: result.concerns_summary ?? null,
          final_ai_recommendation: result.final_ai_recommendation,
          generated_at: now,
          created_by_user_id: actorId,
          updated_by_user_id: actorId,
          deleted_at: null,
          deleted_by_user_id: null,
        },
        { manager },
      );

      const loaded = await this.feedbackAiSummaryRepository.findById(created.id, {
        manager,
      });

      return loaded ?? created;
    });
  }
}
