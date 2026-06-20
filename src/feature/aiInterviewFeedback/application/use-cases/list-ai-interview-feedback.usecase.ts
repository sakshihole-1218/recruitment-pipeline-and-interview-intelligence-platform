import { Injectable } from '@nestjs/common';

import { AiInterviewFeedbackQueryDto } from '../../dto/ai-interview-feedback.query.dto';
import { AiInterviewFeedbackRepository } from '../../repositories/ai-interview-feedback.repository';

@Injectable()
export class ListAiInterviewFeedbackUseCase {
  constructor(private readonly repository: AiInterviewFeedbackRepository) {}

  execute(query: AiInterviewFeedbackQueryDto) {
    return this.repository.findAllWithFilters(query);
  }
}
