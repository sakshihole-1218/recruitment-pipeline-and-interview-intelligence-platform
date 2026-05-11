import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CandidateDocumentType } from '../../enums/candidate-document-type.enum';
import { CandidateDocumentRepository } from '../../repositories/candidate-document.repository';
import { CandidateRepository } from '../../repositories/candidate.repository';

@Injectable()
export class MarkLatestCandidateResumeUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
  ) {}

  async execute(
    candidateId: string,
    documentId: string,
    actorUserId?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const candidate = await this.candidateRepository.findById(candidateId, { manager });
      if (!candidate) {
        throw new NotFoundException({
          message: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      const doc = await this.candidateDocumentRepository.findByIdForCandidate({
        candidateId,
        documentId,
        manager,
      });

      if (!doc) {
        throw new NotFoundException({
          message: 'Candidate document not found',
          code: 'CANDIDATE_DOCUMENT_NOT_FOUND',
        });
      }

      if (doc.document_type !== CandidateDocumentType.RESUME) {
        throw new BadRequestException({
          message: 'Only RESUME documents can be marked as latest',
          code: 'CANDIDATE_DOCUMENT_NOT_RESUME',
        });
      }

      await this.candidateDocumentRepository.unsetLatestResume({
        candidateId,
        manager,
      });

      doc.is_latest = true;
      if (actorUserId) {
        doc.updated_by_user_id = actorUserId;
      }

      return this.candidateDocumentRepository.save(doc, { manager });
    });
  }
}
