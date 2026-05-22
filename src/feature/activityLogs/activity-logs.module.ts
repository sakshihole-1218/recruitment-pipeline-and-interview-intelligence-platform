import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationEntity } from '../applications/entities/application.entity';
import { UserEntity } from '../accessControl/entities/user.entity';

import { ActivityLogEntity } from './entities/activity-log.entity';
import { ApplicationNoteEntity } from './entities/application-note.entity';

import { ActivityLogsController } from './controllers/activity-logs.controller';
import { ApplicationNotesController } from './controllers/application-notes.controller';
import { ApplicationNotesManagementController } from './controllers/application-notes-management.controller';

import { ActivityLogRepository } from './repositories/activity-log.repository';
import { ApplicationNoteRepository } from './repositories/application-note.repository';
import { ActivityLogsReferenceRepository } from './repositories/activity-logs-reference.repository';

import { ApplicationNotesValidationHelper } from './helpers/application-notes-validation.helper';
import { ActivityLogsPaginationHelper } from './helpers/activity-logs-pagination.helper';
import { ApplicationNotesPaginationHelper } from './helpers/application-notes-pagination.helper';

import { CreateActivityLogUseCase } from './application/use-cases/create-activity-log.usecase';
import { CreateApplicationNoteUseCase } from './application/use-cases/create-application-note.usecase';
import { UpdateApplicationNoteUseCase } from './application/use-cases/update-application-note.usecase';
import { FindApplicationNoteByIdUseCase } from './application/use-cases/find-application-note-by-id.usecase';
import { ListApplicationNotesUseCase } from './application/use-cases/list-application-notes.usecase';
import { SoftDeleteApplicationNoteUseCase } from './application/use-cases/soft-delete-application-note.usecase';
import { FindActivityLogByIdUseCase } from './application/use-cases/find-activity-log-by-id.usecase';
import { ListActivityLogsUseCase } from './application/use-cases/list-activity-logs.usecase';

import { ActivityLogsWriterService } from './application/services/activity-logs-writer.service';
import { ActivityLogsService } from './application/services/activity-logs.service';
import { ApplicationNotesService } from './application/services/application-notes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationNoteEntity,
      ActivityLogEntity,
      // reference-only entities (for FK checks)
      ApplicationEntity,
      UserEntity,
    ]),
  ],
  controllers: [
    ActivityLogsController,
    ApplicationNotesController,
    ApplicationNotesManagementController,
  ],
  providers: [
    // repositories
    ActivityLogRepository,
    ApplicationNoteRepository,
    ActivityLogsReferenceRepository,
    // helpers
    ApplicationNotesValidationHelper,
    ActivityLogsPaginationHelper,
    ApplicationNotesPaginationHelper,
    // use-cases
    CreateActivityLogUseCase,
    CreateApplicationNoteUseCase,
    UpdateApplicationNoteUseCase,
    FindApplicationNoteByIdUseCase,
    ListApplicationNotesUseCase,
    SoftDeleteApplicationNoteUseCase,
    FindActivityLogByIdUseCase,
    ListActivityLogsUseCase,
    // services
    ActivityLogsWriterService,
    ActivityLogsService,
    ApplicationNotesService,
  ],
  exports: [ActivityLogsWriterService, ActivityLogRepository],
})
export class ActivityLogsModule {}
