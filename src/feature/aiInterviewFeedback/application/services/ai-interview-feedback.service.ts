import { Injectable } from '@nestjs/common';

import { AiInterviewFeedbackQueryDto } from '../../dto/ai-interview-feedback.query.dto';
import { UpdateAiInterviewFeedbackDto } from '../../dto/update-ai-interview-feedback.dto';
import { DeleteAiInterviewFeedbackUseCase } from '../use-cases/delete-ai-interview-feedback.usecase';
import { GenerateAiInterviewFeedbackUseCase } from '../use-cases/generate-ai-interview-feedback.usecase';
import { GetAiInterviewFeedbackByIdUseCase } from '../use-cases/get-ai-interview-feedback-by-id.usecase';
import { GetFeedbackBySessionUseCase } from '../use-cases/get-feedback-by-session.usecase';
import { ListAiInterviewFeedbackUseCase } from '../use-cases/list-ai-interview-feedback.usecase';
import { RegenerateAiInterviewFeedbackUseCase } from '../use-cases/regenerate-ai-interview-feedback.usecase';
import { UpdateAiInterviewFeedbackUseCase } from '../use-cases/update-ai-interview-feedback.usecase';

@Injectable()
export class AiInterviewFeedbackService {
  constructor(
    private readonly generateUseCase: GenerateAiInterviewFeedbackUseCase,
    private readonly regenerateUseCase: RegenerateAiInterviewFeedbackUseCase,
    private readonly getByIdUseCase: GetAiInterviewFeedbackByIdUseCase,
    private readonly getBySessionUseCase: GetFeedbackBySessionUseCase,
    private readonly listUseCase: ListAiInterviewFeedbackUseCase,
    private readonly updateUseCase: UpdateAiInterviewFeedbackUseCase,
    private readonly deleteUseCase: DeleteAiInterviewFeedbackUseCase,
  ) {}

  generate(sessionId: string, actorUserId?: string) {
    return this.generateUseCase.execute(sessionId, actorUserId);
  }

  regenerate(sessionId: string, actorUserId?: string) {
    return this.regenerateUseCase.execute(sessionId, actorUserId);
  }

  getById(id: string) {
    return this.getByIdUseCase.execute(id);
  }

  getBySession(sessionId: string) {
    return this.getBySessionUseCase.execute(sessionId);
  }

  list(query: AiInterviewFeedbackQueryDto) {
    return this.listUseCase.execute(query);
  }

  update(id: string, dto: UpdateAiInterviewFeedbackDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  softDelete(id: string, actorUserId?: string) {
    return this.deleteUseCase.execute(id, actorUserId);
  }
}
