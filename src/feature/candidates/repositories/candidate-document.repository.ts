import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { CandidateDocumentType } from '../enums/candidate-document-type.enum';
import { CandidateDocumentEntity } from '../entities/candidate-document.entity';

@Injectable()
export class CandidateDocumentRepository {
  constructor(
    @InjectRepository(CandidateDocumentEntity)
    private readonly repository: Repository<CandidateDocumentEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<CandidateDocumentEntity> {
    return manager
      ? manager.getRepository(CandidateDocumentEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'candidate_documents',
    manager?: EntityManager,
  ): SelectQueryBuilder<CandidateDocumentEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findByIdForCandidate(options: {
    candidateId: string;
    documentId: string;
    manager?: EntityManager;
  }): Promise<CandidateDocumentEntity | null> {
    return this.baseQuery('candidate_documents', options.manager)
      .andWhere('candidate_documents.candidate_id = :candidateId', {
        candidateId: options.candidateId,
      })
      .andWhere('candidate_documents.id = :documentId', {
        documentId: options.documentId,
      })
      .getOne();
  }

  async listByCandidateId(
    candidateId: string,
    options?: { manager?: EntityManager },
  ): Promise<CandidateDocumentEntity[]> {
    return this.baseQuery('candidate_documents', options?.manager)
      .andWhere('candidate_documents.candidate_id = :candidateId', { candidateId })
      .orderBy('candidate_documents.uploaded_at', 'DESC')
      .addOrderBy('candidate_documents.created_at', 'DESC')
      .getMany();
  }

  async unsetLatestResume(options: {
    candidateId: string;
    manager?: EntityManager;
  }): Promise<void> {
    await this.repo(options.manager)
      .createQueryBuilder()
      .update(CandidateDocumentEntity)
      .set({ is_latest: false, updated_at: () => 'CURRENT_TIMESTAMP' })
      .where('candidate_id = :candidateId', { candidateId: options.candidateId })
      .andWhere('deleted_at IS NULL')
      .andWhere('document_type = :docType', {
        docType: CandidateDocumentType.RESUME,
      })
      .andWhere('is_latest = true')
      .execute();
  }

  async save(
    entity: CandidateDocumentEntity,
    options?: { manager?: EntityManager },
  ): Promise<CandidateDocumentEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async createAndSave(
    payload: Partial<CandidateDocumentEntity>,
    options?: { manager?: EntityManager },
  ): Promise<CandidateDocumentEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async softDeleteByCandidateId(
    candidateId: string,
    options?: { manager?: EntityManager },
  ): Promise<void> {
    await this.repo(options?.manager)
      .createQueryBuilder()
      .update(CandidateDocumentEntity)
      .set({ deleted_at: () => 'CURRENT_TIMESTAMP' })
      .where('candidate_id = :candidateId', { candidateId })
      .andWhere('deleted_at IS NULL')
      .execute();
  }
}
