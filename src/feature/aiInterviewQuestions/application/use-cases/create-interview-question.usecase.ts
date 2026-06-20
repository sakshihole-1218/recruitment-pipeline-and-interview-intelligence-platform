import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateInterviewQuestionDto } from '../../dto/create-interview-question.dto';
import { AiInterviewQuestionEntity } from '../../entities/ai-interview-question.entity';
import { QuestionType } from '../../enums/question-type.enum';
import { AiInterviewQuestionsValidationHelper } from '../../helpers/ai-interview-questions-validation.helper';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';
import { AiInterviewQuestionsReferenceRepository } from '../../repositories/ai-interview-questions-reference.repository';

@Injectable()
export class CreateInterviewQuestionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewQuestionRepository,
    private readonly referenceRepository: AiInterviewQuestionsReferenceRepository,
    private readonly validation: AiInterviewQuestionsValidationHelper,
  ) {}

  async execute(
    dto: CreateInterviewQuestionDto,
    actorUserId?: string,
  ): Promise<AiInterviewQuestionEntity> {
    this.validation.ensureActorUserRequired(actorUserId);
    this.validation.ensureFollowUpConsistency(
      dto.question_type,
      dto.parent_question_id,
    );

    return this.dataSource.transaction(async (manager) => {
      const session = await this.referenceRepository.findSessionById(
        dto.ai_interview_session_id,
        { manager },
      );

      if (!session) {
        throw new NotFoundException({
          message: 'AI interview session not found',
          code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
        });
      }

      const existingQuestions = await this.repository.findBySessionId(
        dto.ai_interview_session_id,
        {
          manager,
        },
      );

      this.validation.ensureSequenceNumberAvailable(
        dto.sequence_number,
        existingQuestions.map((question) => question.sequence_number),
      );

      let parentQuestionId: string | null = null;
      if (dto.parent_question_id) {
        const parentQuestion = await this.repository.findById(
          dto.parent_question_id,
          {
            manager,
          },
        );

        if (!parentQuestion) {
          throw new NotFoundException({
            message: 'Parent question not found',
            code: 'PARENT_QUESTION_NOT_FOUND',
          });
        }

        this.validation.ensureParentQuestionBelongsToSession(
          parentQuestion,
          dto.ai_interview_session_id,
        );

        parentQuestionId = parentQuestion.id;
      }

      const questionType = dto.question_type;
      const isFollowUp = questionType === QuestionType.FOLLOW_UP;

      return this.repository.createQuestion(
        {
          ai_interview_session_id: dto.ai_interview_session_id,
          parent_question_id: parentQuestionId,
          question_text: dto.question_text.trim(),
          question_type: questionType,
          topic: dto.topic.trim(),
          difficulty_level: dto.difficulty_level,
          sequence_number: dto.sequence_number,
          is_follow_up: isFollowUp,
          generated_from: dto.generated_from,
          expected_answer_keywords: dto.expected_answer_keywords ?? null,
          asked_at: null,
          answered_at: null,
          is_answered: false,
          created_by_user_id: actorUserId,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );
    });
  }
}
