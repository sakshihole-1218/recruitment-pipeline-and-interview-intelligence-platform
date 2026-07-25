import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobOpeningEntity } from '../job-openings/entities/job-opening.entity';
import { CandidateEntity } from '../candidates/entities/candidate.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { InterviewEntity } from '../interviews/entities/interview.entity';
import { OfferEntity } from '../offers/entities/offer.entity';
import { ActivityLogEntity } from '../activityLogs/entities/activity-log.entity';

import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './application/dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobOpeningEntity,
      CandidateEntity,
      ApplicationEntity,
      InterviewEntity,
      OfferEntity,
      ActivityLogEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
