import { Injectable } from '@nestjs/common';

import { InterviewProctoringEventsValidationHelper } from '../../helpers/interview-proctoring-events-validation.helper';
import { InterviewProctoringEventsRepository } from '../../repositories/interview-proctoring-events.repository';

@Injectable()
export class DeleteProctoringEventUseCase {
  constructor(
    private readonly repository: InterviewProctoringEventsRepository,
    private readonly validation: InterviewProctoringEventsValidationHelper,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    this.validation.ensureActorUserRequired(actorUserId);

    const event = await this.repository.findById(id);
    this.validation.ensureEventExists(event, id);

    await this.repository.softDeleteEvent(id, { actorUserId });
  }
}
