import { Injectable } from '@nestjs/common';

import { ListResumeAiAnalysesQueryDto } from '../../dto/list-resume-ai-analyses.query.dto';
import {
  ResumeAiAnalysisListResult,
  ResumeAiAnalysisRepository,
} from '../../repositories/resume-ai-analysis.repository';

@Injectable()
export class ListResumeAiAnalysesUseCase {
  constructor(
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
  ) {}

  async execute(
    query: ListResumeAiAnalysesQueryDto,
  ): Promise<ResumeAiAnalysisListResult> {
    return this.resumeAiAnalysisRepository.list(query);
  }
}
