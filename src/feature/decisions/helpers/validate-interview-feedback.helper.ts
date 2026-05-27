import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { InterviewStatus } from '../../interviews/enums/interview-status.enum';

@Injectable()
export class ValidateInterviewFeedbackHelper {
  async ensureFeedbackExistsForMandatoryRounds(options: {
    applicationId: string;
    mandatoryRoundIds: string[];
    manager: EntityManager;
  }): Promise<void> {
    if (!options.mandatoryRoundIds.length) return;

    const rows = await options.manager
      .getRepository(InterviewEntity)
      .createQueryBuilder('interviews')
      .select('DISTINCT interviews.interview_round_id', 'interview_round_id')
      .where('interviews.application_id = :applicationId', {
        applicationId: options.applicationId,
      })
      .andWhere('interviews.interview_round_id IN (:...roundIds)', {
        roundIds: options.mandatoryRoundIds,
      })
      .andWhere('interviews.interview_status = :status', {
        status: InterviewStatus.COMPLETED,
      })
      .andWhere('interviews.deleted_at IS NULL')
      .andWhere(
        `EXISTS (
          SELECT 1
          FROM interview_feedback f
          WHERE f.interview_id = interviews.id
            AND f.deleted_at IS NULL
        )`,
      )
      .getRawMany<{ interview_round_id: string }>();

    const roundsWithFeedback = new Set(rows.map((r) => r.interview_round_id));
    const missingRoundIds = options.mandatoryRoundIds.filter(
      (id) => !roundsWithFeedback.has(id),
    );

    if (!missingRoundIds.length) return;

    throw new ConflictException({
      message: 'Interview feedback is required before creating final decision',
      code: 'DECISION_FEEDBACK_REQUIRED',
      meta: { missing_round_ids: missingRoundIds },
    });
  }
}
