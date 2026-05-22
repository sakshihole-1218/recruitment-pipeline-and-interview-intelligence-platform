import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivityLogsModule } from '../activityLogs/activity-logs.module';

import { SkillsController } from './controllers/skills.controller';
import { SkillsService } from './application/services/skills.service';
import { SkillEntity } from './entities/skill.entity';
import { SkillRepository } from './repositories/skill.repository';
import { SkillsValidationHelper } from './helpers/skills-validation.helper';
import { SkillsPaginationHelper } from './helpers/skills-pagination.helper';
import { CreateSkillUseCase } from './application/use-cases/create-skill.usecase';
import { UpdateSkillUseCase } from './application/use-cases/update-skill.usecase';
import { UpdateSkillStatusUseCase } from './application/use-cases/update-skill-status.usecase';
import { FindSkillByIdUseCase } from './application/use-cases/find-skill-by-id.usecase';
import { ListSkillsUseCase } from './application/use-cases/list-skills.usecase';
import { SoftDeleteSkillUseCase } from './application/use-cases/soft-delete-skill.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([SkillEntity]), ActivityLogsModule],
  controllers: [SkillsController],
  providers: [
    SkillRepository,
    SkillsValidationHelper,
    SkillsPaginationHelper,
    // use-cases
    CreateSkillUseCase,
    UpdateSkillUseCase,
    UpdateSkillStatusUseCase,
    FindSkillByIdUseCase,
    ListSkillsUseCase,
    SoftDeleteSkillUseCase,
    // service
    SkillsService,
  ],
  exports: [SkillsService, SkillRepository],
})
export class SkillsModule {}
