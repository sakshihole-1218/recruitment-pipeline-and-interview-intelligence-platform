import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationEntity } from '../applications/entities/application.entity';
import { ApplicationStageHistoryEntity } from '../applications/entities/application-stage-history.entity';
import { ApplicationRepository } from '../applications/repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../applications/repositories/application-stage-history.repository';
import { ApplicationsValidationHelper } from '../applications/helpers/applications-validation.helper';

import { OffersController } from './controllers/offers.controller';
import { OffersService } from './application/services/offers.service';
import { OfferEntity } from './entities/offer.entity';
import { OfferRepository } from './repositories/offer.repository';
import { OffersValidationHelper } from './helpers/offers-validation.helper';
import { OffersPaginationHelper } from './helpers/offers-pagination.helper';

import { CreateOfferUseCase } from './application/use-cases/create-offer.usecase';
import { UpdateOfferUseCase } from './application/use-cases/update-offer.usecase';
import { FindOfferByIdUseCase } from './application/use-cases/find-offer-by-id.usecase';
import { FindOfferByApplicationIdUseCase } from './application/use-cases/find-offer-by-application-id.usecase';
import { ListOffersUseCase } from './application/use-cases/list-offers.usecase';
import { SendOfferUseCase } from './application/use-cases/send-offer.usecase';
import { AcceptOfferUseCase } from './application/use-cases/accept-offer.usecase';
import { DeclineOfferUseCase } from './application/use-cases/decline-offer.usecase';
import { CancelOfferUseCase } from './application/use-cases/cancel-offer.usecase';
import { ExpireOfferUseCase } from './application/use-cases/expire-offer.usecase';
import { SoftDeleteOfferUseCase } from './application/use-cases/soft-delete-offer.usecase';
import { ActivityLogsModule } from '../activityLogs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OfferEntity,
      ApplicationEntity,
      ApplicationStageHistoryEntity,
    ]),
    ActivityLogsModule,
  ],
  controllers: [OffersController],
  providers: [
    // repositories
    OfferRepository,
    ApplicationRepository,
    ApplicationStageHistoryRepository,
    // helpers
    OffersValidationHelper,
    OffersPaginationHelper,
    ApplicationsValidationHelper,
    // use-cases
    CreateOfferUseCase,
    UpdateOfferUseCase,
    FindOfferByIdUseCase,
    FindOfferByApplicationIdUseCase,
    ListOffersUseCase,
    SendOfferUseCase,
    AcceptOfferUseCase,
    DeclineOfferUseCase,
    CancelOfferUseCase,
    ExpireOfferUseCase,
    SoftDeleteOfferUseCase,
    // service
    OffersService,
  ],
  exports: [OffersService, OfferRepository],
})
export class OffersModule {}
