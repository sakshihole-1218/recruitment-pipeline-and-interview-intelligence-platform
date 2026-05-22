import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CancelInterviewDto } from '../../dto/cancel-interview.dto';
import { InterviewEntity } from '../../entities/interview.entity';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewRepository } from '../../repositories/interview.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CancelInterviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    interviewId: string,
    dto: CancelInterviewDto,
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

      if (
        [InterviewStatus.CANCELLED, InterviewStatus.COMPLETED].includes(
          interview.interview_status,
        )
      ) {
        throw new ConflictException({
          message: 'Interview cannot be cancelled in the current status',
          code: 'INTERVIEW_NOT_CANCELLABLE',
        });
      }

      const oldStatus = interview.interview_status;

      interview.interview_status = InterviewStatus.CANCELLED;
      interview.cancel_reason = String(dto.cancel_reason).trim();
      interview.updated_by_user_id = actorUserId;

      await this.interviewRepository.save(interview, { manager });

      const loaded = await this.interviewRepository.findById(interview.id, {
        manager,
        withRelations: true,
      });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_POST_CANCEL_LOAD_FAILED',
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
            cancel_reason_present: Boolean(dto.cancel_reason),
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
