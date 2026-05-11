import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateCandidateDocumentMetadataDto } from '../../dto/create-candidate-document-metadata.dto';
import { CandidateDocumentType } from '../../enums/candidate-document-type.enum';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateDocumentRepository } from '../../repositories/candidate-document.repository';
import { CandidatesValidationHelper } from '../../helpers/candidates-validation.helper';

@Injectable()
export class AddCandidateDocumentMetadataUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
    private readonly validationHelper: CandidatesValidationHelper,
  ) {}

  async execute(
    candidateId: string,
    dto: CreateCandidateDocumentMetadataDto,
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

      this.validationHelper.ensureLatestFlagValid({
        document_type: dto.document_type,
        is_latest: dto.is_latest,
      });

      const uploadedAt = dto.uploaded_at ? new Date(dto.uploaded_at) : new Date();
      if (Number.isNaN(uploadedAt.getTime())) {
        throw new BadRequestException({
          message: 'Invalid uploaded_at value',
          code: 'INVALID_UPLOADED_AT',
        });
      }

      const isLatest = dto.is_latest ?? false;
      if (dto.document_type === CandidateDocumentType.RESUME && isLatest) {
        await this.candidateDocumentRepository.unsetLatestResume({
          candidateId,
          manager,
        });
      }

      return this.candidateDocumentRepository.createAndSave(
        {
          candidate_id: candidateId,
          document_type: dto.document_type,
          file_name: dto.file_name,
          file_url: dto.file_url,
          file_size:
            dto.file_size === undefined || dto.file_size === null
              ? null
              : String(dto.file_size),
          mime_type: dto.mime_type ?? null,
          uploaded_at: uploadedAt,
          is_latest: isLatest,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: actorUserId ?? null,
        },
        { manager },
      );
    });
  }
}
