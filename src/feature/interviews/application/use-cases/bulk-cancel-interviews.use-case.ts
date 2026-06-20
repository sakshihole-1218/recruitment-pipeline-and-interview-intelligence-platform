import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { BulkCancelInterviewsDto } from '../../dto/bulk-cancel-interviews.dto';
import {
  BulkCancelInterviewsResultResponseDto,
  BulkInterviewOperationFailureDto,
} from '../../dto/bulk-operation-result.response.dto';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewRepository } from '../../repositories/interview.repository';

@Injectable()
export class BulkCancelInterviewsUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    dto: BulkCancelInterviewsDto,
    actorUserId?: string,
  ): Promise<BulkCancelInterviewsResultResponseDto> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    const successfulIds: string[] = [];
    const failures: BulkInterviewOperationFailureDto[] = [];

    for (const interviewId of dto.interview_ids) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const now = new Date();
          const interview = await this.interviewRepository.findById(
            interviewId,
            {
              manager,
              withRelations: true,
            },
          );

          if (!interview) {
            throw new NotFoundException({
              message: 'Interview not found',
              code: 'INTERVIEW_NOT_FOUND',
            });
          }

          if (
            ![InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED].includes(
              interview.interview_status,
            )
          ) {
            throw new ConflictException({
              message: 'Interview cannot be cancelled in the current status',
              code: 'INTERVIEW_NOT_CANCELLABLE',
              meta: { interview_status: interview.interview_status },
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
        });

        successfulIds.push(interviewId);
      } catch (error) {
        failures.push({
          interview_id: interviewId,
          reason: this.extractErrorReason(error),
        });
      }
    }

    return {
      success_count: successfulIds.length,
      failed_count: failures.length,
      successful_ids: successfulIds,
      failures,
    };
  }

  private extractErrorReason(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object') {
        const message = (response as any).message;
        if (typeof message === 'string') return message;
        if (Array.isArray(message) && message.length) return String(message[0]);
      }
      return error.message;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }

    return 'Unable to process record';
  }
}
