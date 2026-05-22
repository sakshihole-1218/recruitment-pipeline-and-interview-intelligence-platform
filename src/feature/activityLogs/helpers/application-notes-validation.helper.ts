import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { ApplicationNoteEntity } from '../entities/application-note.entity';
import { NoteType } from '../enums/note-type.enum';

@Injectable()
export class ApplicationNotesValidationHelper {
  ensureActorUserId(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureCanViewNote(options: {
    note: ApplicationNoteEntity;
    actorUserId: string;
    actorRoles?: SystemRoleCode[];
  }): void {
    if (!options.note.is_private) {
      return;
    }

    const isAdmin = (options.actorRoles ?? []).includes(SystemRoleCode.ADMIN);
    const isOwner = options.note.user_id === options.actorUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException({
        message: 'You do not have access to this note',
        code: 'NOTE_ACCESS_FORBIDDEN',
      });
    }
  }

  ensureCanManageNote(options: {
    note: ApplicationNoteEntity;
    actorUserId: string;
    actorRoles?: SystemRoleCode[];
  }): void {
    const isAdmin = (options.actorRoles ?? []).includes(SystemRoleCode.ADMIN);
    const isOwner = options.note.user_id === options.actorUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException({
        message: 'You can only update or delete your own notes',
        code: 'NOTE_MANAGE_FORBIDDEN',
      });
    }
  }

  ensureCanUseNoteType(options: {
    noteType: NoteType;
    actorRoles?: SystemRoleCode[];
  }): void {
    const roles = options.actorRoles ?? [];
    if (roles.includes(SystemRoleCode.ADMIN)) {
      return;
    }

    const allowed = new Set<NoteType>();
    if (roles.includes(SystemRoleCode.RECRUITER)) {
      allowed.add(NoteType.RECRUITER_NOTE);
    }
    if (roles.includes(SystemRoleCode.INTERVIEWER)) {
      allowed.add(NoteType.INTERVIEWER_NOTE);
    }
    if (roles.includes(SystemRoleCode.HIRING_MANAGER)) {
      allowed.add(NoteType.HIRING_MANAGER_NOTE);
    }

    // SYSTEM_NOTE is reserved for admins/system actions.
    if (options.noteType === NoteType.SYSTEM_NOTE) {
      throw new ForbiddenException({
        message: 'You are not allowed to create or set system notes',
        code: 'NOTE_TYPE_FORBIDDEN',
      });
    }

    if (!allowed.has(options.noteType)) {
      throw new ForbiddenException({
        message: 'You are not allowed to create or set this note type',
        code: 'NOTE_TYPE_FORBIDDEN',
      });
    }
  }
}
