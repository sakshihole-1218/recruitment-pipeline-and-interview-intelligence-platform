import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { FeedbackGenerationStatus } from '../../../aiInterviewSessions/enums/feedback-generation-status.enum';
import { UpdateAiInterviewFeedbackDto } from '../../dto/update-ai-interview-feedback.dto';
import { AiInterviewFeedbackEntity } from '../../entities/ai-interview-feedback.entity';
import { AiInterviewFeedbackStatus } from '../../enums/ai-interview-feedback-status.enum';
import { AiInterviewFeedbackValidationHelper } from '../../helpers/ai-interview-feedback-validation.helper';
import { AiInterviewFeedbackReferenceRepository } from '../../repositories/ai-interview-feedback-reference.repository';
import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class UpdateAiInterviewFeedbackUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewFeedbackRepository,
    private readonly referenceRepository: AiInterviewFeedbackReferenceRepository,
    private readonly validation: AiInterviewFeedbackValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: UpdateAiInterviewFeedbackDto,
    actorUserId?: string,
  ) {
    this.validation.ensureActorUserRequired(actorUserId);
    const actorId = actorUserId;

    return this.dataSource.transaction(async (manager) => {
      const feedback = await this.repository.findById(id, {
        manager,
        lockForUpdate: true,
      });

      if (!feedback) {
        throw new NotFoundException({
          message: 'AI interview feedback not found',
          code: 'AI_INTERVIEW_FEEDBACK_NOT_FOUND',
        });
      }

      const session = await this.referenceRepository.findSessionById(
        feedback.ai_interview_session_id,
        { manager, lockForUpdate: true },
      );

      if (!session) {
        throw new NotFoundException({
          message: 'AI interview session not found',
          code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
        });
      }

      this.applyPatch(feedback, dto, actorId);
      await this.repository.updateFeedback(feedback, { manager });

      await this.referenceRepository.updateSessionFeedbackGenerationStatus({
        session,
        status: this.toSessionFeedbackGenerationStatus(feedback.feedback_status),
        actorUserId: actorId,
        manager,
      });

      const loaded = await this.repository.findById(feedback.id, { manager });
      return loaded ?? feedback;
    });
  }

  private applyPatch(
    entity: AiInterviewFeedbackEntity,
    dto: UpdateAiInterviewFeedbackDto,
    actorUserId: string,
  ): void {
    const scoreFields: Array<keyof UpdateAiInterviewFeedbackDto> = [
      'technical_score',
      'communication_score',
      'problem_solving_score',
      'project_understanding_score',
      'answer_relevance_score',
      'confidence_score',
      'overall_score',
    ];

    scoreFields.forEach((field) => {
      const value = dto[field] as number | undefined;
      if (value !== undefined) {
        this.validation.ensureScoreWithinRange(value, field);
      }
    });

    if (dto.technical_score !== undefined) {
      entity.technical_score = dto.technical_score.toFixed(2);
    }
    if (dto.communication_score !== undefined) {
      entity.communication_score = dto.communication_score.toFixed(2);
    }
    if (dto.problem_solving_score !== undefined) {
      entity.problem_solving_score = dto.problem_solving_score.toFixed(2);
    }
    if (dto.project_understanding_score !== undefined) {
      entity.project_understanding_score = dto.project_understanding_score.toFixed(2);
    }
    if (dto.answer_relevance_score !== undefined) {
      entity.answer_relevance_score = dto.answer_relevance_score.toFixed(2);
    }
    if (dto.confidence_score !== undefined) {
      entity.confidence_score = dto.confidence_score.toFixed(2);
    }

    const componentChanged =
      dto.technical_score !== undefined ||
      dto.communication_score !== undefined ||
      dto.problem_solving_score !== undefined ||
      dto.project_understanding_score !== undefined ||
      dto.answer_relevance_score !== undefined ||
      dto.confidence_score !== undefined;

    if (dto.overall_score !== undefined) {
      entity.overall_score = dto.overall_score.toFixed(2);
    } else if (componentChanged) {
      const overall = this.validation.calculateOverallScore([
        entity.technical_score === null ? null : Number(entity.technical_score),
        entity.communication_score === null ? null : Number(entity.communication_score),
        entity.problem_solving_score === null ? null : Number(entity.problem_solving_score),
        entity.project_understanding_score === null
          ? null
          : Number(entity.project_understanding_score),
        entity.answer_relevance_score === null ? null : Number(entity.answer_relevance_score),
        entity.confidence_score === null ? null : Number(entity.confidence_score),
      ]);

      entity.overall_score = overall === null ? null : overall.toFixed(2);
    }

    if (dto.technical_summary !== undefined) {
      entity.technical_summary = this.validation.normalizeText(dto.technical_summary);
    }
    if (dto.communication_summary !== undefined) {
      entity.communication_summary = this.validation.normalizeText(dto.communication_summary);
    }
    if (dto.problem_solving_summary !== undefined) {
      entity.problem_solving_summary = this.validation.normalizeText(
        dto.problem_solving_summary,
      );
    }
    if (dto.project_understanding_summary !== undefined) {
      entity.project_understanding_summary = this.validation.normalizeText(
        dto.project_understanding_summary,
      );
    }
    if (dto.strengths !== undefined) {
      entity.strengths = this.validation.normalizeText(dto.strengths);
    }
    if (dto.concerns !== undefined) {
      entity.concerns = this.validation.normalizeText(dto.concerns);
    }
    if (dto.improvement_areas !== undefined) {
      entity.improvement_areas = this.validation.normalizeText(dto.improvement_areas);
    }

    if (dto.ai_recommendation !== undefined) {
      entity.ai_recommendation = dto.ai_recommendation;
    } else if (dto.overall_score !== undefined || componentChanged) {
      entity.ai_recommendation = this.validation.toRecommendation(
        entity.overall_score === null ? null : Number(entity.overall_score),
      );
    }

    if (dto.feedback_status !== undefined) {
      this.validation.ensureStatusFailureReasonConsistency(
        dto.feedback_status,
        dto.failure_reason ?? entity.failure_reason,
      );
      entity.feedback_status = dto.feedback_status;
    }

    if (dto.generated_at !== undefined) {
      entity.generated_at = new Date(dto.generated_at);
    } else if (dto.feedback_status === AiInterviewFeedbackStatus.COMPLETED && !entity.generated_at) {
      entity.generated_at = new Date();
    } else if (
      dto.feedback_status !== undefined &&
      dto.feedback_status !== AiInterviewFeedbackStatus.COMPLETED
    ) {
      entity.generated_at = dto.feedback_status === AiInterviewFeedbackStatus.FAILED
        ? null
        : entity.generated_at;
    }

    if (dto.failure_reason !== undefined) {
      entity.failure_reason = this.validation.normalizeText(dto.failure_reason);
    }

    if (dto.raw_ai_payload !== undefined) {
      entity.raw_ai_payload = dto.raw_ai_payload;
    }

    if (!dto.ai_recommendation && !entity.ai_recommendation && entity.overall_score !== null) {
      entity.ai_recommendation = this.validation.toRecommendation(Number(entity.overall_score));
    }

    if (entity.feedback_status === AiInterviewFeedbackStatus.FAILED) {
      this.validation.ensureStatusFailureReasonConsistency(
        entity.feedback_status,
        entity.failure_reason,
      );
    }

    entity.updated_by_user_id = actorUserId;
  }

  private toSessionFeedbackGenerationStatus(
    status: AiInterviewFeedbackStatus,
  ): FeedbackGenerationStatus {
    switch (status) {
      case AiInterviewFeedbackStatus.PENDING:
        return FeedbackGenerationStatus.PENDING;
      case AiInterviewFeedbackStatus.PROCESSING:
        return FeedbackGenerationStatus.PROCESSING;
      case AiInterviewFeedbackStatus.COMPLETED:
        return FeedbackGenerationStatus.COMPLETED;
      case AiInterviewFeedbackStatus.FAILED:
        return FeedbackGenerationStatus.FAILED;
      default:
        return FeedbackGenerationStatus.PENDING;
    }
  }
}