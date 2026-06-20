import { Injectable } from '@nestjs/common';

import { SystemRoleCode } from '../../../accessControl/enums/system-role-code.enum';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { ListApplicationNotesQueryDto } from '../../dto/list-application-notes.query.dto';
import { ApplicationNotesPaginationHelper } from '../../helpers/application-notes-pagination.helper';
import { ActivityLogsReferenceRepository } from '../../repositories/activity-logs-reference.repository';
import { ApplicationNoteRepository } from '../../repositories/application-note.repository';

@Injectable()
export class ListApplicationNotesUseCase {
  constructor(
    private readonly paginationHelper: ApplicationNotesPaginationHelper,
    private readonly notesRepository: ApplicationNoteRepository,
    private readonly referenceRepository: ActivityLogsReferenceRepository,
  ) {}

  async execute(options: {
    applicationId: string;
    query: ListApplicationNotesQueryDto;
    actor: AuthJwtPayload;
  }) {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: options.query.cursor,
      sort_by: options.query.sort_by,
    });

    await this.referenceRepository.ensureApplicationExists(
      options.applicationId,
    );

    const actorUserId = options.actor?.sub;
    const isAdmin = (options.actor?.roles ?? []).includes(SystemRoleCode.ADMIN);

    return this.notesRepository.listByApplication({
      applicationId: options.applicationId,
      query: options.query,
      actorUserId,
      includeAllPrivate: isAdmin,
    });
  }
}
