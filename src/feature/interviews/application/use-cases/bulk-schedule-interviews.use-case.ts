import { BadRequestException, HttpException, Injectable } from '@nestjs/common';

import { BulkScheduleInterviewsDto } from '../../dto/bulk-schedule-interviews.dto';
import {
  BulkScheduleInterviewsFailureDto,
  BulkScheduleInterviewsResultResponseDto,
} from '../../dto/bulk-operation-result.response.dto';
import { ScheduleInterviewDto } from '../../dto/schedule-interview.dto';
import { ScheduleInterviewUseCase } from './schedule-interview.usecase';

@Injectable()
export class BulkScheduleInterviewsUseCase {
  constructor(private readonly scheduleInterviewUseCase: ScheduleInterviewUseCase) {}

  async execute(
    dto: BulkScheduleInterviewsDto,
    actorUserId?: string,
  ): Promise<BulkScheduleInterviewsResultResponseDto> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    const successfulIds: string[] = [];
    const failures: BulkScheduleInterviewsFailureDto[] = [];

    for (const applicationId of dto.application_ids) {
      try {
        const scheduleDto: ScheduleInterviewDto = {
          application_id: applicationId,
          interview_round_id: dto.interview_round_id,
          scheduled_start_at: dto.scheduled_start_at,
          scheduled_end_at: dto.scheduled_end_at,
          interview_mode: dto.interview_mode,
          meeting_link: dto.meeting_link,
          location_details: dto.location_details,
        };

        await this.scheduleInterviewUseCase.execute(scheduleDto, actorUserId);
        successfulIds.push(applicationId);
      } catch (error) {
        failures.push({
          application_id: applicationId,
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
