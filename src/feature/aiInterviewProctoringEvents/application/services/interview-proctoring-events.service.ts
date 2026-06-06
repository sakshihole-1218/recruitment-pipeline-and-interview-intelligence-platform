import { Injectable } from '@nestjs/common';

import { BulkCreateProctoringEventsDto } from '../../dto/bulk-create-proctoring-events.dto';
import { CreateProctoringEventDto } from '../../dto/create-proctoring-event.dto';
import { InterviewProctoringEventQueryDto } from '../../dto/interview-proctoring-event.query.dto';
import { ResolveProctoringEventDto } from '../../dto/resolve-proctoring-event.dto';

import { BulkCreateProctoringEventsUseCase } from '../use-cases/bulk-create-proctoring-events.usecase';
import { CreateProctoringEventUseCase } from '../use-cases/create-proctoring-event.usecase';
import { DeleteProctoringEventUseCase } from '../use-cases/delete-proctoring-event.usecase';
import { GetProctoringEventByIdUseCase } from '../use-cases/get-proctoring-event-by-id.usecase';
import { GetProctoringEventsBySessionUseCase } from '../use-cases/get-proctoring-events-by-session.usecase';
import { GetProctoringRiskSummaryUseCase } from '../use-cases/get-proctoring-risk-summary.usecase';
import { ListProctoringEventsUseCase } from '../use-cases/list-proctoring-events.usecase';
import { ResolveProctoringEventUseCase } from '../use-cases/resolve-proctoring-event.usecase';

@Injectable()
export class InterviewProctoringEventsService {
  constructor(
    private readonly createUseCase: CreateProctoringEventUseCase,
    private readonly bulkCreateUseCase: BulkCreateProctoringEventsUseCase,
    private readonly getByIdUseCase: GetProctoringEventByIdUseCase,
    private readonly getBySessionUseCase: GetProctoringEventsBySessionUseCase,
    private readonly listUseCase: ListProctoringEventsUseCase,
    private readonly resolveUseCase: ResolveProctoringEventUseCase,
    private readonly riskSummaryUseCase: GetProctoringRiskSummaryUseCase,
    private readonly deleteUseCase: DeleteProctoringEventUseCase,
  ) {}

  create(dto: CreateProctoringEventDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  bulkCreate(dto: BulkCreateProctoringEventsDto, actorUserId?: string) {
    return this.bulkCreateUseCase.execute(dto, actorUserId);
  }

  getById(id: string) {
    return this.getByIdUseCase.execute(id);
  }

  getBySession(sessionId: string) {
    return this.getBySessionUseCase.execute(sessionId);
  }

  list(query: InterviewProctoringEventQueryDto) {
    return this.listUseCase.execute(query);
  }

  resolve(id: string, dto: ResolveProctoringEventDto, actorUserId?: string) {
    return this.resolveUseCase.execute(id, dto, actorUserId);
  }

  getRiskSummary(sessionId: string) {
    return this.riskSummaryUseCase.execute(sessionId);
  }

  softDelete(id: string, actorUserId?: string) {
    return this.deleteUseCase.execute(id, actorUserId);
  }
}
