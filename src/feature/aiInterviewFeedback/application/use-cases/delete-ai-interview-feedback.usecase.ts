import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { FeedbackGenerationStatus } from '../../../aiInterviewSessions/enums/feedback-generation-status.enum';
import { AiInterviewFeedbackValidationHelper } from '../../helpers/ai-interview-feedback-validation.helper';
import { AiInterviewFeedbackReferenceRepository } from '../../repositories/ai-interview-feedback-reference.repository';
import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class DeleteAiInterviewFeedbackUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewFeedbackRepository,
    private readonly referenceRepository: AiInterviewFeedbackReferenceRepository,
    private readonly validation: AiInterviewFeedbackValidationHelper,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    this.validation.ensureActorUserRequired(actorUserId);
    const actorId = actorUserId;

    await this.dataSource.transaction(async (manager) => {
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

      await this.repository.softDeleteFeedback(id, {
        actorUserId: actorId,
        manager,
      });

      await this.referenceRepository.updateSessionFeedbackGenerationStatus({
        session,
        status: FeedbackGenerationStatus.PENDING,
        actorUserId: actorId,
        manager,
      });
    });
  }
}
