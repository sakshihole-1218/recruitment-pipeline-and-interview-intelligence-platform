import { Injectable, NotFoundException } from '@nestjs/common';

import { UpdateInterviewQuestionDto } from '../../dto/update-interview-question.dto';
import { AiInterviewQuestionEntity } from '../../entities/ai-interview-question.entity';
import { AiInterviewQuestionsValidationHelper } from '../../helpers/ai-interview-questions-validation.helper';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';

@Injectable()
export class UpdateInterviewQuestionUseCase {
  constructor(
    private readonly repository: AiInterviewQuestionRepository,
    private readonly validation: AiInterviewQuestionsValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: UpdateInterviewQuestionDto,
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

    if (dto.question_text !== undefined) {
      question.question_text = dto.question_text.trim();
    }

    if (dto.asked_at !== undefined) {
      question.asked_at = new Date(dto.asked_at);
    }

    if (dto.answered_at !== undefined) {
      question.answered_at = new Date(dto.answered_at);
      question.is_answered = true;
    }

    if (dto.is_answered !== undefined) {
      question.is_answered = dto.is_answered;

      if (dto.is_answered) {
        question.answered_at = question.answered_at ?? new Date();
      } else {
        question.answered_at = null;
      }
    }

    if (dto.expected_answer_keywords !== undefined) {
      question.expected_answer_keywords = dto.expected_answer_keywords;
    }

    this.validation.ensureAnsweredAfterAsked(question.asked_at, question.answered_at);

    question.updated_by_user_id = actorUserId;
    return this.repository.updateQuestion(question);
  }
}
