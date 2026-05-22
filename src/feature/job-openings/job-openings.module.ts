import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobOpeningsController } from './controllers/job-openings.controller';
import { JobOpeningsService } from './application/services/job-openings.service';
import { JobOpeningEntity } from './entities/job-opening.entity';
import { JobOpeningSkillEntity } from './entities/job-opening-skill.entity';
import { JobOpeningRepository } from './repositories/job-opening.repository';
import { JobOpeningSkillRepository } from './repositories/job-opening-skill.repository';
import { JobOpeningReferenceRepository } from './repositories/job-opening-reference.repository';
import { JobOpeningsPaginationHelper } from './helpers/job-openings-pagination.helper';
import { JobOpeningsValidationHelper } from './helpers/job-openings-validation.helper';
import { CreateJobOpeningUseCase } from './application/use-cases/create-job-opening.usecase';
import { UpdateJobOpeningUseCase } from './application/use-cases/update-job-opening.usecase';
import { FindJobOpeningByIdUseCase } from './application/use-cases/find-job-opening-by-id.usecase';
import { ListJobOpeningsUseCase } from './application/use-cases/list-job-openings.usecase';
import { PublishJobOpeningUseCase } from './application/use-cases/publish-job-opening.usecase';
import { UnpublishJobOpeningUseCase } from './application/use-cases/unpublish-job-opening.usecase';
import { OpenJobOpeningUseCase } from './application/use-cases/open-job-opening.usecase';
import { CloseJobOpeningUseCase } from './application/use-cases/close-job-opening.usecase';
import { ReplaceJobOpeningSkillsUseCase } from './application/use-cases/replace-job-opening-skills.usecase';
import { SoftDeleteJobOpeningUseCase } from './application/use-cases/soft-delete-job-opening.usecase';
import { ActivityLogsModule } from '../activityLogs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobOpeningEntity, JobOpeningSkillEntity]),
    ActivityLogsModule,
  ],
  controllers: [JobOpeningsController],
  providers: [
    JobOpeningRepository,
    JobOpeningSkillRepository,
    JobOpeningReferenceRepository,
    JobOpeningsPaginationHelper,
    JobOpeningsValidationHelper,
    // use-cases
    CreateJobOpeningUseCase,
    UpdateJobOpeningUseCase,
    FindJobOpeningByIdUseCase,
    ListJobOpeningsUseCase,
    PublishJobOpeningUseCase,
    UnpublishJobOpeningUseCase,
    OpenJobOpeningUseCase,
    CloseJobOpeningUseCase,
    ReplaceJobOpeningSkillsUseCase,
    SoftDeleteJobOpeningUseCase,
    // service
    JobOpeningsService,
  ],
  exports: [JobOpeningsService, JobOpeningRepository],
})
export class JobOpeningsModule {}
