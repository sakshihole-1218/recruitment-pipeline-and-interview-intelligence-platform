import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { UpdateApplicationNoteDto } from '../../dto/update-application-note.dto';
import { ApplicationNotesValidationHelper } from '../../helpers/application-notes-validation.helper';
import { ActivityActionType } from '../../enums/activity-action-type.enum';
import { ActivityEntityType } from '../../enums/activity-entity-type.enum';
import { ApplicationNoteEntity } from '../../entities/application-note.entity';
import { ApplicationNoteRepository } from '../../repositories/application-note.repository';
import { ActivityLogsWriterService } from '../services/activity-logs-writer.service';
import { ActivityLogBuilder } from '../../helpers/activity-log.builder';

@Injectable()
export class UpdateApplicationNoteUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notesRepository: ApplicationNoteRepository,
    private readonly activityWriter: ActivityLogsWriterService,
    private readonly validationHelper: ApplicationNotesValidationHelper,
  ) {}

  async execute(options: {
    id: string;
    dto: UpdateApplicationNoteDto;
    actor: AuthJwtPayload;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ApplicationNoteEntity> {
    const actorUserId = options.actor?.sub;
    this.validationHelper.ensureActorUserId(actorUserId);

    const patch: Partial<ApplicationNoteEntity> = {};

    if (typeof options.dto.note_type !== 'undefined') {
      this.validationHelper.ensureCanUseNoteType({
        noteType: options.dto.note_type,
        actorRoles: options.actor?.roles,
      });
      patch.note_type = options.dto.note_type;
    }

    if (typeof options.dto.note_text !== 'undefined') {
      const noteText = String(options.dto.note_text ?? '').trim();
      if (!noteText) {
        throw new BadRequestException({
          message: 'Note text should not be empty',
          code: 'NOTE_TEXT_REQUIRED',
        });
      }
      patch.note_text = noteText;
    }

    if (typeof options.dto.is_private === 'boolean') {
      patch.is_private = options.dto.is_private;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException({
        message: 'No fields to update',
        code: 'NOTE_UPDATE_EMPTY',
      });
    }

    const now = new Date();

    return this.dataSource.transaction(async (manager) => {
      const note = await this.notesRepository.findById(options.id, { manager });
      if (!note) {
        throw new NotFoundException({
          message: 'Note not found',
          code: 'NOTE_NOT_FOUND',
        });
      }

      this.validationHelper.ensureCanManageNote({
        note,
        actorUserId,
        actorRoles: options.actor?.roles,
      });

      const oldValues = {
        note_type: note.note_type,
        note_text: note.note_text,
        is_private: note.is_private,
      };

      if (typeof patch.note_type !== 'undefined') note.note_type = patch.note_type;
      if (typeof patch.note_text !== 'undefined') note.note_text = patch.note_text;
      if (typeof patch.is_private !== 'undefined') note.is_private = patch.is_private;

      note.updated_by_user_id = actorUserId;

      const saved = await this.notesRepository.save(note, { manager });

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.NOTE,
          entityId: saved.id,
          actionType: ActivityActionType.UPDATE,
          actorUserId,
          oldValues,
          newValues: {
            note_type: saved.note_type,
            note_text: saved.note_text,
            is_private: saved.is_private,
          },
          actionAt: now,
          ipAddress: options.ipAddress ?? null,
          userAgent: options.userAgent ?? null,
        }),
        { manager },
      );

      const loaded = await this.notesRepository.findById(saved.id, { manager });
      if (!loaded) {
        throw new BadRequestException({
          message: 'We could not complete the request. Please try again',
          code: 'NOTE_POST_UPDATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
