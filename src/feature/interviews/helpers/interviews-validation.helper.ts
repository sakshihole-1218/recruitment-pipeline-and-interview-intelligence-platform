import { BadRequestException, Injectable } from '@nestjs/common';

import { InterviewMode } from '../enums/interview-mode.enum';
import { InterviewPanelMemberInputDto } from '../dto/assign-interview-panel-members.dto';
import { SubmitInterviewFeedbackDto } from '../dto/submit-interview-feedback.dto';

@Injectable()
export class InterviewsValidationHelper {
  ensureValidScheduleWindow(options: { startAt: Date; endAt: Date }): void {
    const start = options.startAt;
    const end = options.endAt;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException({
        message: 'Invalid schedule timestamps',
        code: 'INVALID_SCHEDULE_TIMESTAMP',
      });
    }

    if (start.getTime() >= end.getTime()) {
      throw new BadRequestException({
        message: 'scheduled_start_at must be before scheduled_end_at',
        code: 'INVALID_SCHEDULE_WINDOW',
      });
    }
  }

  ensureScheduleNotInPast(options: {
    startAt: Date;
    now?: Date;
    graceMs?: number;
  }): void {
    const start = options.startAt;
    const now = options.now ?? new Date();
    const graceMs = options.graceMs ?? 60_000;

    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException({
        message: 'Invalid schedule timestamps',
        code: 'INVALID_SCHEDULE_TIMESTAMP',
      });
    }

    if (start.getTime() < now.getTime() - graceMs) {
      throw new BadRequestException({
        message: 'Interview cannot be scheduled in the past',
        code: 'SCHEDULE_IN_PAST_NOT_ALLOWED',
        meta: {
          start_at: start.toISOString(),
          now: now.toISOString(),
          grace_ms: graceMs,
        },
      });
    }
  }

  ensureValidCompletionTimestamp(options: {
    scheduledStartAt: Date;
    completedAt: Date;
    now?: Date;
    futureGraceMs?: number;
  }): void {
    const scheduledStartAt = options.scheduledStartAt;
    const completedAt = options.completedAt;
    const now = options.now ?? new Date();
    const futureGraceMs = options.futureGraceMs ?? 60_000;

    if (
      Number.isNaN(scheduledStartAt.getTime()) ||
      Number.isNaN(completedAt.getTime())
    ) {
      throw new BadRequestException({
        message: 'Invalid completion timestamps',
        code: 'INVALID_COMPLETION_TIMESTAMP',
      });
    }

    if (completedAt.getTime() < scheduledStartAt.getTime()) {
      throw new BadRequestException({
        message: 'completed_at cannot be before scheduled_start_at',
        code: 'COMPLETED_AT_BEFORE_SCHEDULED_START',
        meta: {
          scheduled_start_at: scheduledStartAt.toISOString(),
          completed_at: completedAt.toISOString(),
        },
      });
    }

    if (completedAt.getTime() > now.getTime() + futureGraceMs) {
      throw new BadRequestException({
        message: 'completed_at cannot be in the future',
        code: 'COMPLETED_AT_IN_FUTURE',
        meta: {
          now: now.toISOString(),
          completed_at: completedAt.toISOString(),
          future_grace_ms: futureGraceMs,
        },
      });
    }
  }

  ensureModeDetails(options: {
    mode: InterviewMode;
    meetingLink?: string | null;
    locationDetails?: string | null;
  }): void {
    const meeting = (options.meetingLink ?? '').trim();
    const location = (options.locationDetails ?? '').trim();

    if (options.mode === InterviewMode.VIRTUAL && !meeting) {
      throw new BadRequestException({
        message: 'meeting_link is required for VIRTUAL interviews',
        code: 'MEETING_LINK_REQUIRED',
      });
    }

    if (options.mode === InterviewMode.ONSITE && !location) {
      throw new BadRequestException({
        message: 'location_details is required for ONSITE interviews',
        code: 'LOCATION_DETAILS_REQUIRED',
      });
    }
  }

  ensureUniquePanelMembers(members: InterviewPanelMemberInputDto[]): void {
    const seen = new Set<string>();
    for (const m of members) {
      const key = String(m.user_id);
      if (seen.has(key)) {
        throw new BadRequestException({
          message: 'Duplicate panel members are not allowed',
          code: 'DUPLICATE_PANEL_MEMBER',
        });
      }
      seen.add(key);
    }
  }

  computeOverallScore(dto: SubmitInterviewFeedbackDto): string {
    const total =
      dto.technical_score +
      dto.communication_score +
      dto.problem_solving_score +
      dto.culture_fit_score;

    const avg = total / 4;
    return avg.toFixed(2);
  }
}
