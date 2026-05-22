import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../accessControl/entities/user.entity';
import { UserRepository } from '../accessControl/repositories/user.repository';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { ApplicationStageHistoryEntity } from '../applications/entities/application-stage-history.entity';
import { ApplicationRepository } from '../applications/repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../applications/repositories/application-stage-history.repository';
import { DecisionsController } from './controllers/decisions.controller';
import { DecisionsService } from './application/services/decisions.service';
import { ApplicationDecisionEntity } from './entities/application-decision.entity';
import { ApplicationDecisionRepository } from './repositories/application-decision.repository';
import { DecisionsPaginationHelper } from './helpers/decisions-pagination.helper';
import { DecisionsValidationHelper } from './helpers/decisions-validation.helper';
import { CreateApplicationDecisionUseCase } from './application/use-cases/create-application-decision.usecase';
import { UpdateApplicationDecisionUseCase } from './application/use-cases/update-application-decision.usecase';
import { FindDecisionByIdUseCase } from './application/use-cases/find-decision-by-id.usecase';
import { FindDecisionByApplicationIdUseCase } from './application/use-cases/find-decision-by-application-id.usecase';
import { ListDecisionsUseCase } from './application/use-cases/list-decisions.usecase';
import { SoftDeleteDecisionUseCase } from './application/use-cases/soft-delete-decision.usecase';
import { ActivityLogsModule } from '../activityLogs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationDecisionEntity,
      ApplicationEntity,
      ApplicationStageHistoryEntity,
      UserEntity,
    ]),
    ActivityLogsModule,
  ],
  controllers: [DecisionsController],
  providers: [
    // repositories
    ApplicationDecisionRepository,
    ApplicationRepository,
    ApplicationStageHistoryRepository,
    UserRepository,
    // helpers
    DecisionsPaginationHelper,
    DecisionsValidationHelper,
    // use-cases
    CreateApplicationDecisionUseCase,
    UpdateApplicationDecisionUseCase,
    FindDecisionByIdUseCase,
    FindDecisionByApplicationIdUseCase,
    ListDecisionsUseCase,
    SoftDeleteDecisionUseCase,
    // service
    DecisionsService,
  ],
  exports: [DecisionsService, ApplicationDecisionRepository],
})
export class DecisionsModule {}
