import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CompleteInterviewDto } from '../../dto/complete-interview.dto';
import { InterviewEntity } from '../../entities/interview.entity';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewsValidationHelper } from '../../helpers/interviews-validation.helper';
import { InterviewRepository } from '../../repositories/interview.repository';

@Injectable()
export class CompleteInterviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly validationHelper: InterviewsValidationHelper,
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

      return loaded;
    });
  }
}
