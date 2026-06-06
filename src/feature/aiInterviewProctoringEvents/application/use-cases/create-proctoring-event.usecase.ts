import { Injectable } from '@nestjs/common';

import { CreateProctoringEventDto } from '../../dto/create-proctoring-event.dto';
import { InterviewProctoringEventEntity } from '../../entities/interview-proctoring-event.entity';
import { BulkCreateProctoringEventsUseCase } from './bulk-create-proctoring-events.usecase';

@Injectable()
export class CreateProctoringEventUseCase {
  constructor(
    private readonly bulkCreateUseCase: BulkCreateProctoringEventsUseCase,
  ) {}

  async execute(
    dto: CreateProctoringEventDto,
    actorUserId?: string,
  ): Promise<InterviewProctoringEventEntity> {
    const result = await this.bulkCreateUseCase.execute(
      {
        ai_interview_session_id: dto.ai_interview_session_id,
        events: [
          {
            event_type: dto.event_type,
            severity: dto.severity,
            event_message: dto.event_message,
            event_metadata: dto.event_metadata,
            occurred_at: dto.occurred_at,
            duration_seconds: dto.duration_seconds,
          },
        ],
      },
      actorUserId,
    );

    return result[0];
  }
}
