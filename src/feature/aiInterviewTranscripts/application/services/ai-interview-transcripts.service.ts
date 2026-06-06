import { Injectable } from '@nestjs/common';

import { BulkCreateTranscriptEntriesDto } from '../../dto/bulk-create-transcript-entries.dto';
import { CreateTranscriptEntryDto } from '../../dto/create-transcript-entry.dto';
import { TranscriptQueryDto } from '../../dto/transcript-query.dto';
import { UpdateTranscriptEntryDto } from '../../dto/update-transcript-entry.dto';

import { BulkCreateTranscriptEntriesUseCase } from '../use-cases/bulk-create-transcript-entries.usecase';
import { CreateTranscriptEntryUseCase } from '../use-cases/create-transcript-entry.usecase';
import { DeleteTranscriptEntryUseCase } from '../use-cases/delete-transcript-entry.usecase';
import { GetTranscriptEntryByIdUseCase } from '../use-cases/get-transcript-entry-by-id.usecase';
import { GetTranscriptBySessionUseCase } from '../use-cases/get-transcript-by-session.usecase';
import { ListTranscriptEntriesUseCase } from '../use-cases/list-transcript-entries.usecase';
import { UpdateTranscriptEntryUseCase } from '../use-cases/update-transcript-entry.usecase';

@Injectable()
export class AiInterviewTranscriptsService {
  constructor(
    private readonly createUseCase: CreateTranscriptEntryUseCase,
    private readonly bulkCreateUseCase: BulkCreateTranscriptEntriesUseCase,
    private readonly getByIdUseCase: GetTranscriptEntryByIdUseCase,
    private readonly getBySessionUseCase: GetTranscriptBySessionUseCase,
    private readonly listUseCase: ListTranscriptEntriesUseCase,
    private readonly updateUseCase: UpdateTranscriptEntryUseCase,
    private readonly deleteUseCase: DeleteTranscriptEntryUseCase,
  ) {}

  create(dto: CreateTranscriptEntryDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  bulkCreate(dto: BulkCreateTranscriptEntriesDto, actorUserId?: string) {
    return this.bulkCreateUseCase.execute(dto, actorUserId);
  }

  getById(id: string) {
    return this.getByIdUseCase.execute(id);
  }

  getBySession(sessionId: string) {
    return this.getBySessionUseCase.execute(sessionId);
  }

  list(query: TranscriptQueryDto) {
    return this.listUseCase.execute(query);
  }

  update(id: string, dto: UpdateTranscriptEntryDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  softDelete(id: string, actorUserId?: string) {
    return this.deleteUseCase.execute(id, actorUserId);
  }
}
