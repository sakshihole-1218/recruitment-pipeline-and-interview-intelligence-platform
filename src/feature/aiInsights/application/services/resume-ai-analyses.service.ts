import { Injectable } from '@nestjs/common';

import { CreateResumeAiAnalysisDto } from '../../dto/create-resume-ai-analysis.dto';
import { ListResumeAiAnalysesQueryDto } from '../../dto/list-resume-ai-analyses.query.dto';
import { RegenerateResumeAiAnalysisDto } from '../../dto/regenerate-resume-ai-analysis.dto';
import { ResumeAiAnalysisEntity } from '../../entities/resume-ai-analysis.entity';
import { ResumeAiAnalysisListResult } from '../../repositories/resume-ai-analysis.repository';

import { CreateResumeAiAnalysisUseCase } from '../use-cases/create-resume-ai-analysis.usecase';
import { DeleteResumeAiAnalysisUseCase } from '../use-cases/delete-resume-ai-analysis.usecase';
import { FindResumeAiAnalysisByCandidateDocumentIdUseCase } from '../use-cases/find-resume-ai-analysis-by-candidate-document-id.usecase';
import { FindResumeAiAnalysisByIdUseCase } from '../use-cases/find-resume-ai-analysis-by-id.usecase';
import { GetLatestResumeAiAnalysisByCandidateUseCase } from '../use-cases/get-latest-resume-ai-analysis-by-candidate.usecase';
import { ListResumeAiAnalysesUseCase } from '../use-cases/list-resume-ai-analyses.usecase';
import { RegenerateResumeAiAnalysisUseCase } from '../use-cases/regenerate-resume-ai-analysis.usecase';
import { StartResumeAiAnalysisUseCase } from '../use-cases/start-resume-ai-analysis.usecase';
import { UpdateResumeAiAnalysisUseCase } from '../use-cases/update-resume-ai-analysis.usecase';

import { UpdateResumeAiAnalysisDto } from '../../dto/update-resume-ai-analysis.dto';

@Injectable()
export class ResumeAiAnalysesService {
  constructor(
    private readonly createUseCase: CreateResumeAiAnalysisUseCase,
    private readonly startUseCase: StartResumeAiAnalysisUseCase,
    private readonly regenerateUseCase: RegenerateResumeAiAnalysisUseCase,
    private readonly findByIdUseCase: FindResumeAiAnalysisByIdUseCase,
    private readonly findByCandidateDocumentIdUseCase: FindResumeAiAnalysisByCandidateDocumentIdUseCase,
    private readonly findLatestByCandidateUseCase: GetLatestResumeAiAnalysisByCandidateUseCase,
    private readonly listUseCase: ListResumeAiAnalysesUseCase,
    private readonly updateUseCase: UpdateResumeAiAnalysisUseCase,
    private readonly deleteUseCase: DeleteResumeAiAnalysisUseCase,
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

  start(id: string, actorUserId?: string): Promise<ResumeAiAnalysisEntity> {
    return this.startUseCase.execute({ id, actorUserId });
  }

  findLatestByCandidateId(candidateId: string): Promise<ResumeAiAnalysisEntity> {
    return this.findLatestByCandidateUseCase.execute(candidateId);
  }

  update(
    id: string,
    dto: UpdateResumeAiAnalysisDto,
    actorUserId?: string,
  ): Promise<ResumeAiAnalysisEntity> {
    return this.updateUseCase.execute({ id, dto, actorUserId });
  }

  async delete(id: string, actorUserId?: string): Promise<void> {
    await this.deleteUseCase.execute({ id, actorUserId });
  }
}
