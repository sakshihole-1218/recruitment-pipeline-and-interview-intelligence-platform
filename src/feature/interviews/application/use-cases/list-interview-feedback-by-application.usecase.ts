import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationEntity } from '../../../applications/entities/application.entity';
import { ListInterviewFeedbackQueryDto } from '../../dto/list-interview-feedback.query.dto';
import { InterviewsPaginationHelper } from '../../helpers/interviews-pagination.helper';
import {
  InterviewFeedbackListResult,
  InterviewFeedbackRepository,
} from '../../repositories/interview-feedback.repository';

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
  ): Promise<InterviewFeedbackListResult> {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
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
      ...query,
      application_id: applicationId,
      interview_id: undefined,
    });
  }
}
