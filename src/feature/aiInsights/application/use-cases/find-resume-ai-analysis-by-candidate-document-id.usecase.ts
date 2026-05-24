import { Injectable, NotFoundException } from '@nestjs/common';

import { ResumeAiAnalysisEntity } from '../../entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisRepository } from '../../repositories/resume-ai-analysis.repository';

@Injectable()
export class FindResumeAiAnalysisByCandidateDocumentIdUseCase {
  constructor(
    private readonly resumeAiAnalysisRepository: ResumeAiAnalysisRepository,
  ) {}

  async execute(candidateDocumentId: string): Promise<ResumeAiAnalysisEntity> {
    const row =
      await this.resumeAiAnalysisRepository.findActiveByCandidateDocumentId(
        candidateDocumentId,
      );

    if (!row) {
      throw new NotFoundException({
        message: 'Resume AI analysis not found for this candidate document',
        code: 'RESUME_AI_ANALYSIS_NOT_FOUND',
      });
    }

    return row;
  }
}
