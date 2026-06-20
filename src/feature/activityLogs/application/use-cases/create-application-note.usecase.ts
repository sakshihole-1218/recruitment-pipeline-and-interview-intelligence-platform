import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { SystemRoleCode } from '../../../accessControl/enums/system-role-code.enum';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { CreateApplicationNoteDto } from '../../dto/create-application-note.dto';
import { ActivityActionType } from '../../enums/activity-action-type.enum';
import { ActivityEntityType } from '../../enums/activity-entity-type.enum';
import { ApplicationNoteEntity } from '../../entities/application-note.entity';
import { ActivityLogsReferenceRepository } from '../../repositories/activity-logs-reference.repository';
import { ApplicationNoteRepository } from '../../repositories/application-note.repository';
import { ActivityLogsWriterService } from '../services/activity-logs-writer.service';
import { ApplicationNotesValidationHelper } from '../../helpers/application-notes-validation.helper';
import { ActivityLogBuilder } from '../../helpers/activity-log.builder';

@Injectable()
export class CreateApplicationNoteUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly referenceRepository: ActivityLogsReferenceRepository,
    private readonly notesRepository: ApplicationNoteRepository,
    private readonly activityWriter: ActivityLogsWriterService,
    private readonly validationHelper: ApplicationNotesValidationHelper,
  ) {}

  async execute(options: {
    applicationId: string;
    dto: CreateApplicationNoteDto;
    actor: AuthJwtPayload;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ApplicationNoteEntity> {
    const actorUserId = options.actor?.sub;
    this.validationHelper.ensureActorUserId(actorUserId);

    this.validationHelper.ensureCanUseNoteType({
      noteType: options.dto.note_type,
      actorRoles: options.actor?.roles,
    });

    await this.referenceRepository.ensureApplicationExists(
      options.applicationId,
    );
    await this.referenceRepository.ensureUserExists(actorUserId);

    const noteText = String(options.dto.note_text ?? '').trim();
    if (!noteText) {
      throw new BadRequestException({
        message: 'Note text should not be empty',
        code: 'NOTE_TEXT_REQUIRED',
      });
    }

    const now = new Date();

    return this.dataSource.transaction(async (manager) => {
      await this.referenceRepository.ensureApplicationExists(
        options.applicationId,
        {
          manager,
        },
      );
      await this.referenceRepository.ensureUserExists(actorUserId, { manager });

      const note = await this.notesRepository.createAndSave(
        {
          application_id: options.applicationId,
          user_id: actorUserId,
          note_type: options.dto.note_type,
          note_text: noteText,
          is_private: Boolean(options.dto.is_private),
          created_by_user_id: actorUserId,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.NOTE,
          entityId: note.id,
          actionType: ActivityActionType.CREATE,
          actorUserId,
          oldValues: null,
          newValues: {
            application_id: note.application_id,
            user_id: note.user_id,
            note_type: note.note_type,
            note_text: note.note_text,
            is_private: note.is_private,
          },
          actionAt: now,
          ipAddress: options.ipAddress ?? null,
          userAgent: options.userAgent ?? null,
        }),
        { manager },
      );

      const loaded = await this.notesRepository.findById(note.id, { manager });
      if (!loaded) {
        throw new BadRequestException({
          message: 'We could not complete the request. Please try again',
          code: 'NOTE_POST_CREATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
