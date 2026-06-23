import { Injectable } from '@nestjs/common';

import { AiInterviewQuestionQueryDto } from '../../dto/ai-interview-question.query.dto';
import { CreateInterviewQuestionDto } from '../../dto/create-interview-question.dto';
import { GenerateInterviewPlanDto } from '../../dto/generate-interview-plan.dto';
import { UpdateInterviewQuestionDto } from '../../dto/update-interview-question.dto';

import { CreateInterviewQuestionUseCase } from '../use-cases/create-interview-question.usecase';
import { DeleteInterviewQuestionUseCase } from '../use-cases/delete-interview-question.usecase';
import { GenerateInterviewPlanUseCase } from '../use-cases/generate-interview-plan.usecase';
import { GenerateFollowUpQuestionUseCase } from '../use-cases/generate-follow-up-question.usecase';
import { GetInterviewQuestionByIdUseCase } from '../use-cases/get-interview-question-by-id.usecase';
import { GetQuestionsBySessionUseCase } from '../use-cases/get-questions-by-session.usecase';
import { ListInterviewQuestionsUseCase } from '../use-cases/list-interview-questions.usecase';
import { MarkQuestionAnsweredUseCase } from '../use-cases/mark-question-answered.usecase';
import { MarkQuestionAskedUseCase } from '../use-cases/mark-question-asked.usecase';
import { UpdateInterviewQuestionUseCase } from '../use-cases/update-interview-question.usecase';

@Injectable()
export class AiInterviewQuestionsService {
  constructor(
    private readonly generatePlanUseCase: GenerateInterviewPlanUseCase,
    private readonly generateFollowUpQuestionUseCase: GenerateFollowUpQuestionUseCase,
    private readonly createUseCase: CreateInterviewQuestionUseCase,
    private readonly updateUseCase: UpdateInterviewQuestionUseCase,
    private readonly markAskedUseCase: MarkQuestionAskedUseCase,
    private readonly markAnsweredUseCase: MarkQuestionAnsweredUseCase,
    private readonly getByIdUseCase: GetInterviewQuestionByIdUseCase,
    private readonly getBySessionUseCase: GetQuestionsBySessionUseCase,
    private readonly listUseCase: ListInterviewQuestionsUseCase,
    private readonly deleteUseCase: DeleteInterviewQuestionUseCase,
  ) {}

  generatePlan(dto: GenerateInterviewPlanDto, actorUserId?: string) {
    return this.generatePlanUseCase.execute(dto, actorUserId);
  }

  generateFollowUp(questionId: string, actorUserId?: string) {
    return this.generateFollowUpQuestionUseCase.execute(
      questionId,
      actorUserId,
    );
  }

  create(dto: CreateInterviewQuestionDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  update(id: string, dto: UpdateInterviewQuestionDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  markAsked(id: string, actorUserId?: string) {
    return this.markAskedUseCase.execute(id, actorUserId);
  }

  markAnswered(id: string, actorUserId?: string) {
    return this.markAnsweredUseCase.execute(id, actorUserId);
  }

  getById(id: string) {
    return this.getByIdUseCase.execute(id);
  }

  getBySession(sessionId: string) {
    return this.getBySessionUseCase.execute(sessionId);
  }

  list(query: AiInterviewQuestionQueryDto) {
    return this.listUseCase.execute(query);
  }

  async softDelete(id: string, actorUserId?: string) {
    await this.deleteUseCase.execute(id, actorUserId);
  }
}
