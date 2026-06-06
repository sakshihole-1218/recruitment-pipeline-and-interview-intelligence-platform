import { Injectable } from '@nestjs/common';

import { InterviewProctoringEventsReferenceRepository } from '../../repositories/interview-proctoring-events-reference.repository';
import { InterviewProctoringEventsRepository } from '../../repositories/interview-proctoring-events.repository';
import { InterviewProctoringEventsValidationHelper } from '../../helpers/interview-proctoring-events-validation.helper';

@Injectable()
export class GetProctoringEventsBySessionUseCase {
  constructor(
    private readonly repository: InterviewProctoringEventsRepository,
    private readonly referenceRepository: InterviewProctoringEventsReferenceRepository,
    private readonly validation: InterviewProctoringEventsValidationHelper,
  ) {}

  async execute(sessionId: string) {
    const session = await this.referenceRepository.findSessionById(sessionId);
    this.validation.ensureSessionExists(sessionId, Boolean(session));
    return this.repository.findBySessionId(sessionId);
  }
}
