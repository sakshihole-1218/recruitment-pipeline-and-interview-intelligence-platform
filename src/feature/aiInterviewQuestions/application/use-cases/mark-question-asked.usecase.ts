import { Injectable, NotFoundException } from '@nestjs/common';

import { AiInterviewQuestionEntity } from '../../entities/ai-interview-question.entity';
import { QuestionStatus } from '../../enums/question-status.enum';
import { AiInterviewQuestionsValidationHelper } from '../../helpers/ai-interview-questions-validation.helper';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';

@Injectable()
export class MarkQuestionAskedUseCase {
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

    question.asked_at = question.asked_at ?? new Date();
    question.question_status = QuestionStatus.ASKED;
    question.updated_by_user_id = actorUserId;

    return this.repository.updateQuestion(question);
  }
}
