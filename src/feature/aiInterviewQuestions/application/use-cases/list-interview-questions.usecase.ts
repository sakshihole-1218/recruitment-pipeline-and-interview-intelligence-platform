import { Injectable } from '@nestjs/common';

import { AiInterviewQuestionQueryDto } from '../../dto/ai-interview-question.query.dto';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';

@Injectable()
export class ListInterviewQuestionsUseCase {
  constructor(private readonly repository: AiInterviewQuestionRepository) {}

  async execute(query: AiInterviewQuestionQueryDto) {
    return this.repository.findAllWithFilters(query);
  }
}
