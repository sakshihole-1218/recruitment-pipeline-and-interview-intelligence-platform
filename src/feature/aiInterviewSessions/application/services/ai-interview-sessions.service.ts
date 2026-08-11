import { Injectable } from '@nestjs/common';

import { CreateAiInterviewSessionDto } from '../../dto/create-ai-interview-session.dto';
import { UpdateAiInterviewSessionDto } from '../../dto/update-ai-interview-session.dto';
import { AiInterviewSessionQueryDto } from '../../dto/ai-interview-session.query.dto';

import { CreateAiInterviewSessionUseCase } from '../use-cases/create-ai-interview-session.usecase';
import { StartAiInterviewSessionUseCase } from '../use-cases/start-ai-interview-session.usecase';
import { EndAiInterviewSessionUseCase } from '../use-cases/end-ai-interview-session.usecase';
import { CancelAiInterviewSessionUseCase } from '../use-cases/cancel-ai-interview-session.usecase';
import { MarkAiInterviewSessionFailedUseCase } from '../use-cases/mark-ai-interview-session-failed.usecase';
import { GetAiInterviewSessionByIdUseCase } from '../use-cases/get-ai-interview-session-by-id.usecase';
import { GetAiInterviewSessionByInterviewIdUseCase } from '../use-cases/get-ai-interview-session-by-interview-id.usecase';
import { ListAiInterviewSessionsUseCase } from '../use-cases/list-ai-interview-sessions.usecase';
import { UpdateAiInterviewSessionUseCase } from '../use-cases/update-ai-interview-session.usecase';
import { DeleteAiInterviewSessionUseCase } from '../use-cases/delete-ai-interview-session.usecase';

@Injectable()
export class AiInterviewSessionsService {
  constructor(
    private readonly createUseCase: CreateAiInterviewSessionUseCase,
    private readonly startUseCase: StartAiInterviewSessionUseCase,
    private readonly endUseCase: EndAiInterviewSessionUseCase,
    private readonly cancelUseCase: CancelAiInterviewSessionUseCase,
    private readonly markFailedUseCase: MarkAiInterviewSessionFailedUseCase,
    private readonly getByIdUseCase: GetAiInterviewSessionByIdUseCase,
    private readonly getByInterviewUseCase: GetAiInterviewSessionByInterviewIdUseCase,
    private readonly listUseCase: ListAiInterviewSessionsUseCase,
    private readonly updateUseCase: UpdateAiInterviewSessionUseCase,
    private readonly deleteUseCase: DeleteAiInterviewSessionUseCase,
  ) {}

  create(dto: CreateAiInterviewSessionDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  start(id: string, actorUserId?: string) {
    return this.startUseCase.execute(id, actorUserId);
  }

  end(id: string, actorUserId?: string) {
    return this.endUseCase.execute(id, actorUserId);
  }

  cancel(id: string, reason: string | undefined, actorUserId?: string) {
    return this.cancelUseCase.execute(id, { actorUserId, reason });
  }

  markFailed(id: string, reason: string, actorUserId?: string) {
    return this.markFailedUseCase.execute(id, { actorUserId, reason });
  }

  getById(id: string, actor?: any) {
    return this.getByIdUseCase.execute(id, actor);
  }

  getByInterviewId(interviewId: string, actor?: any) {
    return this.getByInterviewUseCase.execute(interviewId, actor);
  }

  list(query: AiInterviewSessionQueryDto) {
    return this.listUseCase.execute(query);
  }

  update(id: string, dto: UpdateAiInterviewSessionDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  async softDelete(id: string, actorUserId?: string) {
    await this.deleteUseCase.execute(id, actorUserId);
  }
}
