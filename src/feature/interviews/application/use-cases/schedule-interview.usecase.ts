import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationEntity } from '../../../applications/entities/application.entity';
import { ApplicationStatus } from '../../../applications/enums/application-status.enum';
import { UserEntity } from '../../../accessControl/entities/user.entity';
import { ScheduleInterviewDto } from '../../dto/schedule-interview.dto';
import { InterviewEntity } from '../../entities/interview.entity';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewsValidationHelper } from '../../helpers/interviews-validation.helper';
import { InterviewPanelMemberRepository } from '../../repositories/interview-panel-member.repository';
import { InterviewRepository } from '../../repositories/interview.repository';
import { InterviewRoundRepository } from '../../repositories/interview-round.repository';

@Injectable()
export class ScheduleInterviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly interviewRoundRepository: InterviewRoundRepository,
    private readonly panelMemberRepository: InterviewPanelMemberRepository,
    private readonly validationHelper: InterviewsValidationHelper,
  ) {}

  async execute(dto: ScheduleInterviewDto, actorUserId: string): Promise<InterviewEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const application = await manager
        .getRepository(ApplicationEntity)
        .createQueryBuilder('applications')
        .where('applications.id = :id', { id: dto.application_id })
        .andWhere('applications.deleted_at IS NULL')
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
          message: 'Interview cannot be scheduled for this application status',
          code: 'APPLICATION_NOT_ELIGIBLE_FOR_INTERVIEW',
        });
      }

      const round = await this.interviewRoundRepository.findById(
        dto.interview_round_id,
        { manager },
      );

      if (!round) {
        throw new NotFoundException({
          message: 'Interview round not found',
          code: 'INTERVIEW_ROUND_NOT_FOUND',
        });
      }

      const startAt = new Date(dto.scheduled_start_at);
      const endAt = new Date(dto.scheduled_end_at);

      this.validationHelper.ensureValidScheduleWindow({ startAt, endAt });
      this.validationHelper.ensureScheduleNotInPast({ startAt });
      this.validationHelper.ensureModeDetails({
        mode: dto.interview_mode,
        meetingLink: dto.meeting_link ?? null,
        locationDetails: dto.location_details ?? null,
      });

      const duplicate = await this.interviewRepository.findDuplicateSchedule({
        applicationId: dto.application_id,
        interviewRoundId: dto.interview_round_id,
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

      let created: InterviewEntity;
      try {
        created = await this.interviewRepository.createAndSave(
          {
            application_id: dto.application_id,
            interview_round_id: dto.interview_round_id,
            scheduled_start_at: startAt,
            scheduled_end_at: endAt,
            interview_mode: dto.interview_mode,
            meeting_link: dto.meeting_link?.trim() || null,
            location_details: dto.location_details?.trim() || null,
            interview_status: InterviewStatus.SCHEDULED,
            scheduled_by_user_id: actorUserId,
            rescheduled_from_interview_id: null,
            reschedule_reason: null,
            cancel_reason: null,
            completed_at: null,
            created_by_user_id: actorUserId,
            updated_by_user_id: null,
            deleted_by_user_id: null,
            deleted_at: null,
          },
          { manager },
        );
      } catch (error: any) {
        if (String(error?.code) === '23505') {
          throw new ConflictException({
            message: 'Interview is already scheduled for the same time window',
            code: 'INTERVIEW_DUPLICATE_SCHEDULE',
          });
        }
        throw error;
      }

      if (dto.members?.length) {
        this.validationHelper.ensureUniquePanelMembers(dto.members);

        const userIds = dto.members.map((m) => m.user_id);
        const users = await manager
          .getRepository(UserEntity)
          .createQueryBuilder('users')
          .where('users.id IN (:...userIds)', { userIds })
          .andWhere('users.deleted_at IS NULL')
          .getMany();

        const found = new Set(users.map((u) => u.id));
        const missing = userIds.filter((id) => !found.has(id));

        if (missing.length) {
          throw new BadRequestException({
            message: 'One or more panel members are invalid users',
            code: 'PANEL_MEMBER_INVALID_USER',
            meta: { missing_user_ids: missing },
          });
        }

        for (const member of dto.members) {
          await this.panelMemberRepository.createAndSave(
            {
              interview_id: created.id,
              user_id: member.user_id,
              role_in_panel: member.role_in_panel,
              deleted_at: null,
            },
            { manager },
          );
        }
      }

      const loaded = await this.interviewRepository.findById(created.id, {
        manager,
        withRelations: true,
      });

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_POST_CREATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
