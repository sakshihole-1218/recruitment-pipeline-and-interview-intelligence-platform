import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { InterviewRoundEntity } from '../../interviews/entities/interview-round.entity';
import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { InterviewStatus } from '../../interviews/enums/interview-status.enum';

@Injectable()
export class ValidateMandatoryInterviewsHelper {
  async getMandatoryRounds(options: {
    jobOpeningId: string;
    manager: EntityManager;
  }): Promise<InterviewRoundEntity[]> {
    return options.manager
      .getRepository(InterviewRoundEntity)
      .createQueryBuilder('rounds')
      .where('rounds.job_opening_id = :jobOpeningId', {
        jobOpeningId: options.jobOpeningId,
      })
      .andWhere('rounds.is_mandatory = true')
      .andWhere('rounds.deleted_at IS NULL')
      .getMany();
  }

  async ensureAllMandatoryRoundsCompleted(options: {
    applicationId: string;
    jobOpeningId: string;
    manager: EntityManager;
  }): Promise<{ mandatoryRoundIds: string[] }> {
    const rounds = await this.getMandatoryRounds({
      jobOpeningId: options.jobOpeningId,
      manager: options.manager,
    });

    if (!rounds.length) {
      return { mandatoryRoundIds: [] };
    }

    const mandatoryRoundIds = rounds.map((r) => r.id);

    const completedRows = await options.manager
      .getRepository(InterviewEntity)
      .createQueryBuilder('interviews')
      .select('DISTINCT interviews.interview_round_id', 'interview_round_id')
      .where('interviews.application_id = :applicationId', {
        applicationId: options.applicationId,
      })
      .andWhere('interviews.interview_round_id IN (:...roundIds)', {
        roundIds: mandatoryRoundIds,
      })
      .andWhere('interviews.interview_status = :status', {
        status: InterviewStatus.COMPLETED,
      })
      .andWhere('interviews.deleted_at IS NULL')
      .getRawMany<{ interview_round_id: string }>();

    const completed = new Set(completedRows.map((r) => r.interview_round_id));
    const missing = rounds
      .filter((r) => !completed.has(r.id))
      .map((r) => ({
        id: r.id,
        round_name: r.round_name,
        sequence_number: r.sequence_number,
      }));

    if (missing.length) {
      throw new ConflictException({
        message:
          'All mandatory interview rounds must be completed before creating final decision',
        code: 'DECISION_MANDATORY_ROUNDS_INCOMPLETE',
        meta: { missing_rounds: missing },
      });
    }

    return { mandatoryRoundIds };
  }
}
