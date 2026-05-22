import { Injectable } from '@nestjs/common';

import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { CreateApplicationNoteDto } from '../../dto/create-application-note.dto';
import { UpdateApplicationNoteDto } from '../../dto/update-application-note.dto';
import { ListApplicationNotesQueryDto } from '../../dto/list-application-notes.query.dto';
import { CreateApplicationNoteUseCase } from '../use-cases/create-application-note.usecase';
import { UpdateApplicationNoteUseCase } from '../use-cases/update-application-note.usecase';
import { FindApplicationNoteByIdUseCase } from '../use-cases/find-application-note-by-id.usecase';
import { ListApplicationNotesUseCase } from '../use-cases/list-application-notes.usecase';
import { SoftDeleteApplicationNoteUseCase } from '../use-cases/soft-delete-application-note.usecase';

@Injectable()
export class ApplicationNotesService {
  constructor(
    private readonly createUseCase: CreateApplicationNoteUseCase,
    private readonly updateUseCase: UpdateApplicationNoteUseCase,
    private readonly findByIdUseCase: FindApplicationNoteByIdUseCase,
    private readonly listUseCase: ListApplicationNotesUseCase,
    private readonly softDeleteUseCase: SoftDeleteApplicationNoteUseCase,
  ) {}

  async create(options: {
    applicationId: string;
    dto: CreateApplicationNoteDto;
    actor: AuthJwtPayload;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.createUseCase.execute(options);
  }

  async update(options: {
    id: string;
    dto: UpdateApplicationNoteDto;
    actor: AuthJwtPayload;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.updateUseCase.execute(options);
  }

  async findById(id: string, actor: AuthJwtPayload) {
    return this.findByIdUseCase.execute(id, actor);
  }

  async listByApplication(options: {
    applicationId: string;
    query: ListApplicationNotesQueryDto;
    actor: AuthJwtPayload;
  }) {
    return this.listUseCase.execute(options);
  }

  async softDelete(options: {
    id: string;
    actor: AuthJwtPayload;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.softDeleteUseCase.execute(options);
  }
}
