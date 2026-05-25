import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationsController } from './controllers/applications.controller';
import { ApplicationsService } from './application/services/applications.service';

import { ApplicationEntity } from './entities/application.entity';
import { ApplicationStageHistoryEntity } from './entities/application-stage-history.entity';

import { ApplicationRepository } from './repositories/application.repository';
import { ApplicationStageHistoryRepository } from './repositories/application-stage-history.repository';
import { ApplicationReferenceRepository } from './repositories/application-reference.repository';

import { ApplicationsPaginationHelper } from './helpers/applications-pagination.helper';
import { ApplicationsValidationHelper } from './helpers/applications-validation.helper';

import { CreateApplicationUseCase } from './application/use-cases/create-application.usecase';
import { FindApplicationByIdUseCase } from './application/use-cases/find-application-by-id.usecase';
import { ListApplicationsUseCase } from './application/use-cases/list-applications.usecase';
import { RejectApplicationUseCase } from './application/use-cases/reject-application.usecase';
import { HoldApplicationUseCase } from './application/use-cases/hold-application.usecase';
import { WithdrawApplicationUseCase } from './application/use-cases/withdraw-application.usecase';
import { ListApplicationStageHistoryUseCase } from './application/use-cases/list-application-stage-history.usecase';
import { BulkMoveApplicationStageUseCase } from './application/use-cases/bulk-move-application-stage.use-case';
import { BulkRejectApplicationsUseCase } from './application/use-cases/bulk-reject-applications.use-case';
import { BulkAssignRecruiterUseCase } from './application/use-cases/bulk-assign-recruiter.use-case';
import { BulkAssignHiringManagerUseCase } from './application/use-cases/bulk-assign-hiring-manager.use-case';

import { CandidateEntity } from '../candidates/entities/candidate.entity';
import { JobOpeningEntity } from '../job-openings/entities/job-opening.entity';
import { UserEntity } from '../accessControl/entities/user.entity';
import { ActivityLogsModule } from '../activityLogs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationEntity,
      ApplicationStageHistoryEntity,
      CandidateEntity,
      JobOpeningEntity,
      UserEntity,
    ]),
    ActivityLogsModule,
  ],
  controllers: [ApplicationsController],
  providers: [
    // repositories
    ApplicationRepository,
    ApplicationStageHistoryRepository,
    ApplicationReferenceRepository,
    // helpers
    ApplicationsPaginationHelper,
    ApplicationsValidationHelper,
    // use-cases
    CreateApplicationUseCase,
    FindApplicationByIdUseCase,
    ListApplicationsUseCase,
    RejectApplicationUseCase,
    HoldApplicationUseCase,
    WithdrawApplicationUseCase,
    ListApplicationStageHistoryUseCase,
    BulkMoveApplicationStageUseCase,
    BulkRejectApplicationsUseCase,
    BulkAssignRecruiterUseCase,
    BulkAssignHiringManagerUseCase,
    // service
    ApplicationsService,
  ],
  exports: [ApplicationsService, ApplicationRepository],
})
export class ApplicationsModule {}
