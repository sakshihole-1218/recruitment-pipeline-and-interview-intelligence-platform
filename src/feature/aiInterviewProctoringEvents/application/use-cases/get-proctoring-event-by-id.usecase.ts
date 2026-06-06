import { Injectable } from '@nestjs/common';

import { InterviewProctoringEventEntity } from '../../entities/interview-proctoring-event.entity';
import { InterviewProctoringEventsValidationHelper } from '../../helpers/interview-proctoring-events-validation.helper';
import { InterviewProctoringEventsRepository } from '../../repositories/interview-proctoring-events.repository';

@Injectable()
export class GetProctoringEventByIdUseCase {
  constructor(
    private readonly repository: InterviewProctoringEventsRepository,
    private readonly validation: InterviewProctoringEventsValidationHelper,
  ) {}

  async execute(id: string): Promise<InterviewProctoringEventEntity> {
    const event = await this.repository.findById(id);
    this.validation.ensureEventExists(event, id);
    return event;
  }
}
