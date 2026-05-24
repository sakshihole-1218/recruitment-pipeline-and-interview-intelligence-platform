import { Injectable } from '@nestjs/common';

import { CreateResumeAiAnalysisDto } from '../../dto/create-resume-ai-analysis.dto';
import { ListResumeAiAnalysesQueryDto } from '../../dto/list-resume-ai-analyses.query.dto';
import { RegenerateResumeAiAnalysisDto } from '../../dto/regenerate-resume-ai-analysis.dto';
import { ResumeAiAnalysisEntity } from '../../entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisListResult } from '../../repositories/resume-ai-analysis.repository';

import { CreateResumeAiAnalysisUseCase } from '../use-cases/create-resume-ai-analysis.usecase';
import { FindResumeAiAnalysisByCandidateDocumentIdUseCase } from '../use-cases/find-resume-ai-analysis-by-candidate-document-id.usecase';
import { FindResumeAiAnalysisByIdUseCase } from '../use-cases/find-resume-ai-analysis-by-id.usecase';
import { ListResumeAiAnalysesUseCase } from '../use-cases/list-resume-ai-analyses.usecase';
import { RegenerateResumeAiAnalysisUseCase } from '../use-cases/regenerate-resume-ai-analysis.usecase';

@Injectable()
export class ResumeAiAnalysesService {
  constructor(
    private readonly createUseCase: CreateResumeAiAnalysisUseCase,
    private readonly regenerateUseCase: RegenerateResumeAiAnalysisUseCase,
    private readonly findByIdUseCase: FindResumeAiAnalysisByIdUseCase,
    private readonly findByCandidateDocumentIdUseCase: FindResumeAiAnalysisByCandidateDocumentIdUseCase,
    private readonly listUseCase: ListResumeAiAnalysesUseCase,
  ) {}

  create(dto: CreateResumeAiAnalysisDto, actorUserId?: string): Promise<ResumeAiAnalysisEntity> {
    return this.createUseCase.execute(dto, actorUserId);
  }

  regenerate(
    candidateDocumentId: string,
    dto: RegenerateResumeAiAnalysisDto,
    actorUserId?: string,
  ): Promise<ResumeAiAnalysisEntity> {
    return this.regenerateUseCase.execute({
      candidateDocumentId,
      dto,
      actorUserId,
    });
  }

  findById(id: string): Promise<ResumeAiAnalysisEntity> {
    return this.findByIdUseCase.execute(id);
  }

  findByCandidateDocumentId(candidateDocumentId: string): Promise<ResumeAiAnalysisEntity> {
    return this.findByCandidateDocumentIdUseCase.execute(candidateDocumentId);
  }

  list(query: ListResumeAiAnalysesQueryDto): Promise<ResumeAiAnalysisListResult> {
    return this.listUseCase.execute(query);
  }
}
