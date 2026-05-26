import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateApplicationDto } from '../../dto/create-application.dto';
import { ApplicationEntity } from '../../entities/application.entity';
import { ApplicationCurrentStage } from '../../enums/application-current-stage.enum';
import { ApplicationStatus } from '../../enums/application-status.enum';
import { ApplicationsValidationHelper } from '../../helpers/applications-validation.helper';
import { ApplicationRepository } from '../../repositories/application.repository';
import { ApplicationReferenceRepository } from '../../repositories/application-reference.repository';
import { ApplicationStageHistoryRepository } from '../../repositories/application-stage-history.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CreateApplicationUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly referenceRepository: ApplicationReferenceRepository,
    private readonly validationHelper: ApplicationsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(dto: CreateApplicationDto, actorUserId?: string): Promise<ApplicationEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const candidateOk = await this.referenceRepository.candidateExists(
        dto.candidate_id,
        manager,
      );
      if (!candidateOk) {
        throw new BadRequestException({
          message: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      const openingExists = await this.referenceRepository.jobOpeningExists(
        dto.job_opening_id,
        manager,
      );
      if (!openingExists) {
        throw new BadRequestException({
          message: 'Job opening not found',
          code: 'JOB_OPENING_NOT_FOUND',
        });
      }

      const openingOpen = await this.referenceRepository.jobOpeningIsOpen(
        dto.job_opening_id,
        manager,
      );
      if (!openingOpen) {
        throw new ConflictException({
          message: 'Job opening is not open for applications',
          code: 'JOB_OPENING_NOT_OPEN',
        });
      }

      if (dto.assigned_recruiter_user_id) {
        const recruiterOk = await this.referenceRepository.userExists(
          dto.assigned_recruiter_user_id,
          manager,
        );
        if (!recruiterOk) {
          throw new BadRequestException({
            message: 'Assigned recruiter user not found',
            code: 'ASSIGNED_RECRUITER_NOT_FOUND',
          });
        }
      }

      if (dto.assigned_hiring_manager_user_id) {
        const hmOk = await this.referenceRepository.userExists(
          dto.assigned_hiring_manager_user_id,
          manager,
        );
        if (!hmOk) {
          throw new BadRequestException({
            message: 'Assigned hiring manager user not found',
            code: 'ASSIGNED_HIRING_MANAGER_NOT_FOUND',
          });
        }
      }

      await this.validationHelper.ensureNoDuplicateActiveApplication({
        candidateId: dto.candidate_id,
        jobOpeningId: dto.job_opening_id,
        manager,
      });

      const seq = await this.applicationRepository.getNextApplicationNumberSequence(manager);
      const year = new Date().getUTCFullYear();
      const applicationNumber = `APP-${year}-${String(seq).padStart(6, '0')}`;

      const now = new Date();

      const created = await this.applicationRepository.createAndSave(
        {
          application_number: applicationNumber,
          candidate_id: dto.candidate_id,
          job_opening_id: dto.job_opening_id,
          applied_at: now,
          current_stage: ApplicationCurrentStage.APPLIED,
          application_status: ApplicationStatus.ACTIVE,
          screening_score: null,
          fit_score: null,
          assigned_recruiter_user_id: dto.assigned_recruiter_user_id ?? null,
          assigned_hiring_manager_user_id: dto.assigned_hiring_manager_user_id ?? null,
          is_priority: dto.is_priority ?? false,
          rejection_reason: null,
          withdrawal_reason: null,
          last_stage_changed_at: now,
          created_by_user_id: actorUserId,
          updated_by_user_id: actorUserId,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      await this.stageHistoryRepository.createAndSave(
        {
          application_id: created.id,
          from_stage: null,
          to_stage: ApplicationCurrentStage.APPLIED,
          changed_by_user_id: actorUserId,
          change_reason: 'Application created',
          changed_at: now,
        },
        { manager },
      );

      const loaded = await this.applicationRepository.findById(created.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'APPLICATION_POST_CREATE_LOAD_FAILED',
        });
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.APPLICATION,
          entityId: loaded.id,
          actionType: ActivityActionType.CREATE,
          actorUserId,
          oldValues: null,
          newValues: {
            application_number: loaded.application_number,
            candidate_id: loaded.candidate_id,
            job_opening_id: loaded.job_opening_id,
            current_stage: loaded.current_stage,
            application_status: loaded.application_status,
            is_priority: loaded.is_priority,
            assigned_recruiter_user_id: loaded.assigned_recruiter_user_id,
            assigned_hiring_manager_user_id: loaded.assigned_hiring_manager_user_id,
            applied_at: loaded.applied_at?.toISOString?.() ?? null,
          },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      return loaded;
    });
  }
}
