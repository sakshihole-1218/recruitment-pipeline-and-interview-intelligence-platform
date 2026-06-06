import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AiInterviewSessionStatus } from '../../../aiInterviewSessions/enums/ai-interview-session-status.enum';

import { BulkCreateProctoringEventsDto } from '../../dto/bulk-create-proctoring-events.dto';
import { InterviewProctoringEventEntity } from '../../entities/interview-proctoring-event.entity';
import { InterviewProctoringEventsValidationHelper } from '../../helpers/interview-proctoring-events-validation.helper';
import { InterviewProctoringEventsReferenceRepository } from '../../repositories/interview-proctoring-events-reference.repository';
import { InterviewProctoringEventsRepository } from '../../repositories/interview-proctoring-events.repository';

@Injectable()
export class BulkCreateProctoringEventsUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: InterviewProctoringEventsRepository,
    private readonly referenceRepository: InterviewProctoringEventsReferenceRepository,
    private readonly validation: InterviewProctoringEventsValidationHelper,
  ) {}

  async execute(
    dto: BulkCreateProctoringEventsDto,
    actorUserId?: string,
  ): Promise<InterviewProctoringEventEntity[]> {
    this.validation.ensureActorUserRequired(actorUserId);
    this.validation.ensureBulkEventsProvided(dto.events.length);

    dto.events.forEach((event) => {
      this.validation.ensureDurationValid(event.duration_seconds);
    });

    return this.dataSource.transaction(async (manager) => {
      const session = await this.referenceRepository.findSessionById(
        dto.ai_interview_session_id,
        {
          manager,
          lockForUpdate: true,
        },
      );

      if (!session) {
        this.validation.ensureSessionExists(dto.ai_interview_session_id, false);
      }

      const activeSession = session as NonNullable<typeof session>;

      this.validation.ensureSessionAllowsProctoringEvent(
        activeSession.session_status as AiInterviewSessionStatus,
      );

      const payloads = dto.events.map((event) => ({
        ai_interview_session_id: activeSession.id,
        application_id: activeSession.application_id,
        candidate_id: activeSession.candidate_id,
        event_type: event.event_type,
        severity: event.severity,
        event_message: event.event_message.trim(),
        event_metadata: event.event_metadata ?? null,
        occurred_at: event.occurred_at ?? new Date(),
        duration_seconds: event.duration_seconds ?? null,
        is_resolved: false,
        resolved_at: null,
        resolved_by_user_id: null,
        created_by_user_id: actorUserId,
        updated_by_user_id: null,
        deleted_by_user_id: null,
        deleted_at: null,
      }));

      return this.repository.createManyEvents(payloads, { manager });
    });
  }
}
