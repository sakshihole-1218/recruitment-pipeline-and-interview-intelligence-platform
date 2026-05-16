import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { RescheduleInterviewDto } from '../../dto/reschedule-interview.dto';
import { InterviewEntity } from '../../entities/interview.entity';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewsValidationHelper } from '../../helpers/interviews-validation.helper';
import { InterviewRepository } from '../../repositories/interview.repository';

@Injectable()
export class RescheduleInterviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly validationHelper: InterviewsValidationHelper,
  ) {}

  async execute(
    interviewId: string,
    dto: RescheduleInterviewDto,
    actorUserId: string,
  ): Promise<InterviewEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const current = await this.interviewRepository.findById(interviewId, {
        manager,
      });

      if (!current) {
        throw new NotFoundException({
          message: 'Interview not found',
          code: 'INTERVIEW_NOT_FOUND',
        });
      }

      if (current.interview_status !== InterviewStatus.SCHEDULED) {
        throw new ConflictException({
          message: 'Only scheduled interviews can be rescheduled',
          code: 'INTERVIEW_NOT_RESCHEDULABLE',
        });
      }

      const startAt = new Date(dto.scheduled_start_at);
      const endAt = new Date(dto.scheduled_end_at);

      this.validationHelper.ensureValidScheduleWindow({ startAt, endAt });
      this.validationHelper.ensureScheduleNotInPast({ startAt });

      const duplicate = await this.interviewRepository.findDuplicateSchedule({
        applicationId: current.application_id,
        interviewRoundId: current.interview_round_id,
        scheduledStartAt: startAt,
        scheduledEndAt: endAt,
        manager,
      });

      if (duplicate) {
        throw new ConflictException({
          message: 'Interview is already scheduled for the same time window',
          code: 'INTERVIEW_DUPLICATE_SCHEDULE',
          meta: { interview_id: duplicate.id },
        });
      }

      const meetingLink =
        dto.meeting_link !== undefined
          ? dto.meeting_link?.trim() || null
          : current.meeting_link;

      const locationDetails =
        dto.location_details !== undefined
          ? dto.location_details?.trim() || null
          : current.location_details;

      this.validationHelper.ensureModeDetails({
        mode: current.interview_mode,
        meetingLink,
        locationDetails,
      });

      current.interview_status = InterviewStatus.RESCHEDULED;
      current.reschedule_reason = String(dto.reschedule_reason).trim();
      current.updated_by_user_id = actorUserId;

      await this.interviewRepository.save(current, { manager });

      const created = await this.interviewRepository.createAndSave(
        {
          application_id: current.application_id,
          interview_round_id: current.interview_round_id,
          scheduled_start_at: startAt,
          scheduled_end_at: endAt,
          interview_mode: current.interview_mode,
          meeting_link: meetingLink,
          location_details: locationDetails,
          interview_status: InterviewStatus.SCHEDULED,
          scheduled_by_user_id: actorUserId,
          rescheduled_from_interview_id: current.id,
          reschedule_reason: String(dto.reschedule_reason).trim(),
          cancel_reason: null,
          completed_at: null,
          created_by_user_id: actorUserId,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const loaded = await this.interviewRepository.findById(created.id, {
        manager,
        withRelations: true,
      });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_POST_RESCHEDULE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
