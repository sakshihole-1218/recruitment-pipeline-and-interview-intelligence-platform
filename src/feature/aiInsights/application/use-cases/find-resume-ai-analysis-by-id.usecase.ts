import { Injectable, NotFoundException } from '@nestjs/common';

import { ResumeAiAnalysisEntity } from '../../entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisRepository } from '../../repositories/resume-ai-analysis.repository';

@Injectable()
export class FindResumeAiAnalysisByIdUseCase {
  constructor(
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
  ) {}

  async execute(id: string): Promise<ResumeAiAnalysisEntity> {
    const row = await this.resumeAiAnalysisRepository.findById(id);
    if (!row) {
      throw new NotFoundException({
        message: 'Resume AI analysis not found',
        code: 'RESUME_AI_ANALYSIS_NOT_FOUND',
      });
    }
    return row;
  }
}
