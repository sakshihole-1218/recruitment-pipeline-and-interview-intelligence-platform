import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ListInterviewFeedbackQueryDto } from '../../dto/list-interview-feedback.query.dto';
import { InterviewEntity } from '../../entities/interview.entity';
import { InterviewsPaginationHelper } from '../../helpers/interviews-pagination.helper';
import {
  InterviewFeedbackListResult,
  InterviewFeedbackRepository,
} from '../../repositories/interview-feedback.repository';

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
  ): Promise<InterviewFeedbackListResult> {
    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: query.cursor,
      sort_by: query.sort_by,
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
      ...query,
      interview_id: interviewId,
      application_id: undefined,
    });
  }
}
