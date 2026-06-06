import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ResolveProctoringEventDto } from '../../dto/resolve-proctoring-event.dto';
import { InterviewProctoringEventEntity } from '../../entities/interview-proctoring-event.entity';
import { InterviewProctoringEventsValidationHelper } from '../../helpers/interview-proctoring-events-validation.helper';
import { InterviewProctoringEventsRepository } from '../../repositories/interview-proctoring-events.repository';

@Injectable()
export class ResolveProctoringEventUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: InterviewProctoringEventsRepository,
    private readonly validation: InterviewProctoringEventsValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: ResolveProctoringEventDto,
    actorUserId?: string,
  ): Promise<InterviewProctoringEventEntity> {
    return this.dataSource.transaction(async (manager) => {
      const event = await this.repository.findById(id, {
        manager,
        lockForUpdate: true,
      });

      this.validation.ensureEventExists(event, id);
      this.validation.ensureEventNotAlreadyResolved(event);

      const now = new Date();
      event.is_resolved = true;
      event.resolved_at = now;
      event.resolved_by_user_id = actorUserId ?? null;
      event.updated_by_user_id = actorUserId ?? null;

      return this.repository.updateEvent(event, { manager });
    });
  }
}
