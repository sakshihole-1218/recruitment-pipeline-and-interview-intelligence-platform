import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ListInterviewFeedbackQueryDto } from '../../dto/list-interview-feedback.query.dto';
import { InterviewEntity } from '../../entities/interview.entity';
import { InterviewsPaginationHelper } from '../../helpers/interviews-pagination.helper';
import {
  InterviewFeedbackListResult,
  InterviewFeedbackRepository,
} from '../../repositories/interview-feedback.repository';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../../accessControl/enums/system-role-code.enum';

@Injectable()
export class ListInterviewFeedbackByInterviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly paginationHelper: InterviewsPaginationHelper,
    private readonly feedbackRepository: InterviewFeedbackRepository,
  ) {}

  async execute(
    interviewId: string,
    query: ListInterviewFeedbackQueryDto,
    actor?: AuthJwtPayload,
  ): Promise<InterviewFeedbackListResult> {
    const roles = actor?.roles ?? [];
    const isInterviewerOnly =
      roles.includes(SystemRoleCode.INTERVIEWER) &&
      !roles.includes(SystemRoleCode.ADMIN) &&
      !roles.includes(SystemRoleCode.RECRUITER) &&
      !roles.includes(SystemRoleCode.HIRING_MANAGER);

    const effectiveQuery: ListInterviewFeedbackQueryDto = isInterviewerOnly
      ? {
          ...query,
          interviewer_user_id: actor?.sub,
        }
      : query;

    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: effectiveQuery.cursor,
      sort_by: effectiveQuery.sort_by,
    });

    const interview = await this.dataSource
      .getRepository(InterviewEntity)
      .createQueryBuilder('interviews')
      .where('interviews.id = :id', { id: interviewId })
      .andWhere('interviews.deleted_at IS NULL')
      .getOne();

    if (!interview) {
      throw new NotFoundException({
        message: 'Interview not found',
        code: 'INTERVIEW_NOT_FOUND',
      });
    }

    return this.feedbackRepository.list({
      ...effectiveQuery,
      interview_id: interviewId,
      application_id: undefined,
    });
  }
}
