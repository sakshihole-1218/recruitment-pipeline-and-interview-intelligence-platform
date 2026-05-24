import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateDocumentEntity } from '../../candidates/entities/candidate-document.entity';
import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { InterviewFeedbackEntity } from '../../interviews/entities/interview-feedback.entity';

@Injectable()
export class AiInsightsReferenceRepository {
  async findCandidateDocumentById(
    id: string,
    manager: EntityManager,
  ): Promise<CandidateDocumentEntity | null> {
    return manager
      .getRepository(CandidateDocumentEntity)
      .createQueryBuilder('candidate_documents')
      .where('candidate_documents.deleted_at IS NULL')
      .andWhere('candidate_documents.id = :id', { id })
      .getOne();
  }

  async findApplicationById(
    id: string,
    manager: EntityManager,
  ): Promise<ApplicationEntity | null> {
    return manager
      .getRepository(ApplicationEntity)
      .createQueryBuilder('applications')
      .where('applications.deleted_at IS NULL')
      .andWhere('applications.id = :id', { id })
      .getOne();
  }

  async listInterviewFeedbackByApplicationId(options: {
    applicationId: string;
    manager: EntityManager;
  }): Promise<InterviewFeedbackEntity[]> {
    const qb = options.manager
      .getRepository(InterviewFeedbackEntity)
      .createQueryBuilder('interview_feedback')
      .where('interview_feedback.deleted_at IS NULL')
      .innerJoin(
        InterviewEntity,
        'interviews',
        'interviews.id = interview_feedback.interview_id AND interviews.deleted_at IS NULL',
      )
      .andWhere('interviews.application_id = :applicationId', {
        applicationId: options.applicationId,
      });

    qb.orderBy('interview_feedback.submitted_at', 'ASC');
    qb.addOrderBy('interview_feedback.id', 'ASC');

    return qb.getMany();
  }
}
