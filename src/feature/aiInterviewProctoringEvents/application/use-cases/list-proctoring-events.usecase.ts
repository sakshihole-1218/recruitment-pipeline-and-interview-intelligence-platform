import { Injectable } from '@nestjs/common';

import { InterviewProctoringEventQueryDto } from '../../dto/interview-proctoring-event.query.dto';
import { InterviewProctoringEventsRepository } from '../../repositories/interview-proctoring-events.repository';

@Injectable()
export class ListProctoringEventsUseCase {
  constructor(private readonly repository: InterviewProctoringEventsRepository) {}

  execute(query: InterviewProctoringEventQueryDto) {
    return this.repository.findAllWithFilters(query);
  }
}
