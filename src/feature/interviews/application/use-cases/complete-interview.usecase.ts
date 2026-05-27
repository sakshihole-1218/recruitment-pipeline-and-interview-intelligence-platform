import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationEntity } from '../../../applications/entities/application.entity';
import { ApplicationCurrentStage } from '../../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../../applications/enums/application-status.enum';
import { CompleteInterviewDto } from '../../dto/complete-interview.dto';
import { InterviewEntity } from '../../entities/interview.entity';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewsValidationHelper } from '../../helpers/interviews-validation.helper';
import { InterviewRepository } from '../../repositories/interview.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CompleteInterviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly validationHelper: InterviewsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    interviewId: string,
    dto: CompleteInterviewDto,
    actorUserId: string,
  ): Promise<InterviewEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const interview = await this.interviewRepository.findById(interviewId, {
        manager,
        withRelations: true,
      });

      if (!interview) {
        throw new NotFoundException({
          message: 'Interview not found',
          code: 'INTERVIEW_NOT_FOUND',
        });
      }

      const application = await manager
        .getRepository(ApplicationEntity)
        .createQueryBuilder('applications')
        .where('applications.id = :id', { id: interview.application_id })
        .andWhere('applications.deleted_at IS NULL')
        .setLock('pessimistic_write')
        .getOne();

      if (!application) {
        throw new NotFoundException({
          message: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      if (
        [
          ApplicationStatus.REJECTED,
          ApplicationStatus.WITHDRAWN,
          ApplicationStatus.HIRED,
        ].includes(application.application_status)
      ) {
        throw new BadRequestException({
          message: 'Interview cannot be completed for this application status',
          code: 'APPLICATION_NOT_ELIGIBLE_FOR_INTERVIEW',
        });
      }

      if (
        ![
          ApplicationCurrentStage.INTERVIEW,
          ApplicationCurrentStage.DECISION,
        ].includes(application.current_stage)
      ) {
        throw new ConflictException({
          message:
            'Interview can only be completed when application is in INTERVIEW or DECISION stage',
          code: 'APPLICATION_NOT_ELIGIBLE_FOR_INTERVIEW_STAGE',
          meta: { current_stage: application.current_stage },
        });
      }

      if (interview.interview_status === InterviewStatus.CANCELLED) {
        throw new ConflictException({
          message: 'Cancelled interviews cannot be marked as completed',
          code: 'INTERVIEW_INVALID_STATUS_FOR_COMPLETION',
        });
      }

      if (interview.interview_status === InterviewStatus.COMPLETED) {
        return interview;
      }

      const completedAt = dto.completed_at ? new Date(dto.completed_at) : new Date();
      if (Number.isNaN(completedAt.getTime())) {
        throw new BadRequestException({
          message: 'Invalid completed_at timestamp',
          code: 'INVALID_COMPLETED_AT',
        });
      }

      this.validationHelper.ensureValidCompletionTimestamp({
        scheduledStartAt: interview.scheduled_start_at,
        completedAt,
      });

      const oldStatus = interview.interview_status;
      interview.interview_status = InterviewStatus.COMPLETED;
      interview.completed_at = completedAt;
      interview.updated_by_user_id = actorUserId;

      await this.interviewRepository.save(interview, { manager });

      const loaded = await this.interviewRepository.findById(interview.id, {
        manager,
        withRelations: true,
      });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_POST_COMPLETE_LOAD_FAILED',
        });
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.INTERVIEW,
          entityId: loaded.id,
          actionType: ActivityActionType.STATUS_CHANGE,
          actorUserId,
          oldValues: { interview_status: oldStatus },
          newValues: {
            interview_status: loaded.interview_status,
            completed_at: loaded.completed_at?.toISOString?.() ?? null,
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
