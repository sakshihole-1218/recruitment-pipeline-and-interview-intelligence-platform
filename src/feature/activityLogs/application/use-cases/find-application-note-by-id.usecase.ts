import { Injectable, NotFoundException } from '@nestjs/common';

import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { ApplicationNotesValidationHelper } from '../../helpers/application-notes-validation.helper';
import { ApplicationNoteRepository } from '../../repositories/application-note.repository';

@Injectable()
export class FindApplicationNoteByIdUseCase {
  constructor(
    private readonly notesRepository: ApplicationNoteRepository,
    private readonly validationHelper: ApplicationNotesValidationHelper,
  ) {}

  async execute(id: string, actor: AuthJwtPayload) {
    const note = await this.notesRepository.findById(id);
    if (!note) {
      throw new NotFoundException({
        message: 'Note not found',
        code: 'NOTE_NOT_FOUND',
      });
    }

    const actorUserId = actor?.sub;
    this.validationHelper.ensureActorUserId(actorUserId);
    this.validationHelper.ensureCanViewNote({
      note,
      actorUserId,
      actorRoles: actor?.roles,
    });

    return note;
  }
}
