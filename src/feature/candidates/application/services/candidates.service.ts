import { Injectable } from '@nestjs/common';

import { CreateCandidateDto } from '../../dto/create-candidate.dto';
import { UpdateCandidateDto } from '../../dto/update-candidate.dto';
import { ListCandidatesQueryDto } from '../../dto/list-candidates.query.dto';
import { UpsertCandidateSkillsDto } from '../../dto/upsert-candidate-skills.dto';
import { UploadCandidateDocumentDto } from '../../dto/upload-candidate-document.dto';
import { CreateCandidateUseCase } from '../use-cases/create-candidate.usecase';
import { UpdateCandidateUseCase } from '../use-cases/update-candidate.usecase';
import { FindCandidateByIdUseCase } from '../use-cases/find-candidate-by-id.usecase';
import { ListCandidatesUseCase } from '../use-cases/list-candidates.usecase';
import { SoftDeleteCandidateUseCase } from '../use-cases/soft-delete-candidate.usecase';
import { UpsertCandidateSkillsUseCase } from '../use-cases/upsert-candidate-skills.usecase';
import { RemoveCandidateSkillUseCase } from '../use-cases/remove-candidate-skill.usecase';
import { ListCandidateSkillsUseCase } from '../use-cases/list-candidate-skills.usecase';
import { ListCandidateDocumentsUseCase } from '../use-cases/list-candidate-documents.usecase';
import { MarkLatestCandidateResumeUseCase } from '../use-cases/mark-latest-candidate-resume.usecase';
import {
  UploadCandidateDocumentUseCase,
  UploadedCandidateFile,
} from '../use-cases/upload-candidate-document.usecase';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly createUseCase: CreateCandidateUseCase,
    private readonly updateUseCase: UpdateCandidateUseCase,
    private readonly findByIdUseCase: FindCandidateByIdUseCase,
    private readonly listUseCase: ListCandidatesUseCase,
    private readonly softDeleteUseCase: SoftDeleteCandidateUseCase,
    private readonly upsertSkillsUseCase: UpsertCandidateSkillsUseCase,
    private readonly removeSkillUseCase: RemoveCandidateSkillUseCase,
    private readonly listSkillsUseCase: ListCandidateSkillsUseCase,
    private readonly listDocumentsUseCase: ListCandidateDocumentsUseCase,
    private readonly markLatestResumeUseCase: MarkLatestCandidateResumeUseCase,
    private readonly uploadDocumentUseCase: UploadCandidateDocumentUseCase,
  ) {}

  async create(dto: CreateCandidateDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  async update(id: string, dto: UpdateCandidateDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  async findById(id: string) {
    return this.findByIdUseCase.execute(id);
  }

  async list(query: ListCandidatesQueryDto) {
    return this.listUseCase.execute(query);
  }

  async softDelete(id: string, actorUserId?: string) {
    return this.softDeleteUseCase.execute(id, actorUserId);
  }

  async upsertSkills(candidateId: string, dto: UpsertCandidateSkillsDto) {
    return this.upsertSkillsUseCase.execute(candidateId, dto.skills);
  }

  async listSkills(candidateId: string) {
    return this.listSkillsUseCase.execute(candidateId);
  }

  async removeSkill(candidateId: string, skillId: string) {
    return this.removeSkillUseCase.execute(candidateId, skillId);
  }

  async uploadDocument(
    candidateId: string,
    dto: UploadCandidateDocumentDto,
    file: UploadedCandidateFile | undefined,
    actorUserId?: string,
  ) {
    return this.uploadDocumentUseCase.execute(candidateId, dto, file, actorUserId);
  }

  async listDocuments(candidateId: string) {
    return this.listDocumentsUseCase.execute(candidateId);
  }

  async markLatestResume(
    candidateId: string,
    documentId: string,
    actorUserId?: string,
  ) {
    return this.markLatestResumeUseCase.execute(candidateId, documentId, actorUserId);
  }
}
