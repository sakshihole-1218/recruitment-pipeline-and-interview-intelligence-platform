import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewQuestionEntity } from '../../entities/ai-interview-question.entity';
import { QuestionStatus } from '../../enums/question-status.enum';
import { AiInterviewQuestionsValidationHelper } from '../../helpers/ai-interview-questions-validation.helper';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';

@Injectable()
export class MarkQuestionAnsweredUseCase {
  constructor(
    private readonly repository: AiInterviewQuestionRepository,
    private readonly validation: AiInterviewQuestionsValidationHelper,
  ) {}

  async execute(
    id: string,
    actorUserId?: string,
  ): Promise<AiInterviewQuestionEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

    const question = await this.repository.findById(id);
    if (!question) {
      throw new NotFoundException({
        message: 'AI interview question not found',
        code: 'AI_INTERVIEW_QUESTION_NOT_FOUND',
      });
    }

    const now = new Date();
    question.asked_at = question.asked_at ?? now;
    question.answered_at = question.answered_at ?? now;
    question.is_answered = true;
    question.question_status = QuestionStatus.ANSWERED;
    question.updated_by_user_id = actorUserId;

    this.validation.ensureAnsweredAfterAsked(
      question.asked_at,
      question.answered_at,
    );

    return this.repository.updateQuestion(question);
  }
}
