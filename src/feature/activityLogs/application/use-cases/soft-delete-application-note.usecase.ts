import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { ApplicationNotesValidationHelper } from '../../helpers/application-notes-validation.helper';
import { ActivityActionType } from '../../enums/activity-action-type.enum';
import { ActivityEntityType } from '../../enums/activity-entity-type.enum';
import { ApplicationNoteRepository } from '../../repositories/application-note.repository';
import { ActivityLogsWriterService } from '../services/activity-logs-writer.service';
import { ActivityLogBuilder } from '../../helpers/activity-log.builder';

@Injectable()
export class SoftDeleteApplicationNoteUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notesRepository: ApplicationNoteRepository,
    private readonly activityWriter: ActivityLogsWriterService,
    private readonly validationHelper: ApplicationNotesValidationHelper,
  ) {}

  async execute(options: {
    id: string;
    actor: AuthJwtPayload;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const actorUserId = options.actor?.sub;
    this.validationHelper.ensureActorUserId(actorUserId);

    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
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
        application_id: note.application_id,
        user_id: note.user_id,
        note_type: note.note_type,
        note_text: note.note_text,
        is_private: note.is_private,
      };

      note.deleted_at = now;
      note.deleted_by_user_id = actorUserId;
      note.updated_by_user_id = actorUserId;

      const saved = await this.notesRepository.save(note, { manager });

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.NOTE,
          entityId: saved.id,
          actionType: ActivityActionType.DELETE,
          actorUserId,
          oldValues,
          newValues: { deleted_at: now.toISOString() },
          actionAt: now,
          ipAddress: options.ipAddress ?? null,
          userAgent: options.userAgent ?? null,
        }),
        { manager },
      );
    });
  }
}
