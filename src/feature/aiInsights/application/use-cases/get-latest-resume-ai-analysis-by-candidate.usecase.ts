import { Injectable, NotFoundException } from '@nestjs/common';

import { ResumeAiAnalysisEntity } from '../../entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisRepository } from '../../repositories/resume-ai-analysis.repository';

@Injectable()
export class GetLatestResumeAiAnalysisByCandidateUseCase {
  constructor(
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
  ) {}

  async execute(candidateId: string): Promise<ResumeAiAnalysisEntity> {
    const row = await this.resumeAiAnalysisRepository.findLatestByCandidateId(
      candidateId,
    );

    if (!row) {
      throw new NotFoundException({
        message: 'No resume AI analysis found for this candidate',
        code: 'RESUME_AI_ANALYSIS_NOT_FOUND',
      });
    }

    return row;
  }
}
