import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationEntity } from '../../../applications/entities/application.entity';
import { ListInterviewFeedbackQueryDto } from '../../dto/list-interview-feedback.query.dto';
import { InterviewsPaginationHelper } from '../../helpers/interviews-pagination.helper';
import {
  InterviewFeedbackListResult,
  InterviewFeedbackRepository,
} from '../../repositories/interview-feedback.repository';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../../accessControl/enums/system-role-code.enum';

@Injectable()
export class ListInterviewFeedbackByApplicationUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly paginationHelper: InterviewsPaginationHelper,
    private readonly feedbackRepository: InterviewFeedbackRepository,
  ) {}

  async execute(
    applicationId: string,
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

    const application = await this.dataSource
      .getRepository(ApplicationEntity)
      .createQueryBuilder('applications')
      .where('applications.id = :id', { id: applicationId })
      .andWhere('applications.deleted_at IS NULL')
      .getOne();

    if (!application) {
      throw new NotFoundException({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND',
      });
    }

    return this.feedbackRepository.list({
      ...effectiveQuery,
      application_id: applicationId,
      interview_id: undefined,
    });
  }
}
