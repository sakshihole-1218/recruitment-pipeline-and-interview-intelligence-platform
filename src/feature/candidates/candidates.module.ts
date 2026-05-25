import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidatesController } from './controllers/candidates.controller';
import { CandidatesService } from './application/services/candidates.service';
import { CandidateEntity } from './entities/candidate.entity';
import { CandidateSkillEntity } from './entities/candidate-skill.entity';
import { CandidateDocumentEntity } from './entities/candidate-document.entity';
import { SkillEntity } from '../skills/entities/skill.entity';

import { CandidateRepository } from './repositories/candidate.repository';
import { CandidateSkillRepository } from './repositories/candidate-skill.repository';
import { CandidateDocumentRepository } from './repositories/candidate-document.repository';
import { CandidateReferenceRepository } from './repositories/candidate-reference.repository';
import { CandidatesValidationHelper } from './helpers/candidates-validation.helper';
import { CandidatesPaginationHelper } from './helpers/candidates-pagination.helper';

import { CreateCandidateUseCase } from './application/use-cases/create-candidate.usecase';
import { UpdateCandidateUseCase } from './application/use-cases/update-candidate.usecase';
import { FindCandidateByIdUseCase } from './application/use-cases/find-candidate-by-id.usecase';
import { ListCandidatesUseCase } from './application/use-cases/list-candidates.usecase';
import { SoftDeleteCandidateUseCase } from './application/use-cases/soft-delete-candidate.usecase';
import { UpsertCandidateSkillsUseCase } from './application/use-cases/upsert-candidate-skills.usecase';
import { RemoveCandidateSkillUseCase } from './application/use-cases/remove-candidate-skill.usecase';
import { ListCandidateSkillsUseCase } from './application/use-cases/list-candidate-skills.usecase';
import { ListCandidateDocumentsUseCase } from './application/use-cases/list-candidate-documents.usecase';
import { MarkLatestCandidateResumeUseCase } from './application/use-cases/mark-latest-candidate-resume.usecase';
import { UploadCandidateDocumentUseCase } from './application/use-cases/upload-candidate-document.usecase';
import { BulkCreateCandidatesUseCase } from './application/use-cases/bulk-create-candidates.usecase';
import { BulkUpdateCandidateStatusUseCase } from './application/use-cases/bulk-update-candidate-status.usecase';
import { BulkAddSkillsUseCase } from './application/use-cases/bulk-add-skills.usecase';
import { ActivityLogsModule } from '../activityLogs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateEntity,
      CandidateSkillEntity,
      CandidateDocumentEntity,
      SkillEntity,
    ]),
    ActivityLogsModule,
  ],
  controllers: [CandidatesController],
  providers: [
    // repositories
    CandidateRepository,
    CandidateSkillRepository,
    CandidateDocumentRepository,
    CandidateReferenceRepository,
    // helpers
    CandidatesValidationHelper,
    CandidatesPaginationHelper,
    // use-cases
    CreateCandidateUseCase,
    UpdateCandidateUseCase,
    FindCandidateByIdUseCase,
    ListCandidatesUseCase,
    SoftDeleteCandidateUseCase,
    UpsertCandidateSkillsUseCase,
    RemoveCandidateSkillUseCase,
    ListCandidateSkillsUseCase,
    ListCandidateDocumentsUseCase,
    MarkLatestCandidateResumeUseCase,
    UploadCandidateDocumentUseCase,
    BulkCreateCandidatesUseCase,
    BulkUpdateCandidateStatusUseCase,
    BulkAddSkillsUseCase,
    // service
    CandidatesService,
  ],
  exports: [CandidatesService, CandidateRepository],
})
export class CandidatesModule {}
