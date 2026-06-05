import { Injectable } from '@nestjs/common';

import { AiInterviewSessionQueryDto } from '../../dto/ai-interview-session.query.dto';
import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';

@Injectable()
export class ListAiInterviewSessionsUseCase {
  constructor(private readonly repository: AiInterviewSessionRepository) {}

  async execute(query: AiInterviewSessionQueryDto) {
    return this.repository.findAllWithFilters(query);
  }
}
