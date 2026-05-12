import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UploadCandidateDocumentDto } from '../../dto/upload-candidate-document.dto';
import { CandidateDocumentType } from '../../enums/candidate-document-type.enum';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateDocumentRepository } from '../../repositories/candidate-document.repository';
import { CandidatesValidationHelper } from '../../helpers/candidates-validation.helper';

export type UploadedCandidateFile = {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class UploadCandidateDocumentUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
    private readonly validationHelper: CandidatesValidationHelper,
  ) {}

  async execute(
    candidateId: string,
    dto: UploadCandidateDocumentDto,
    file: UploadedCandidateFile | undefined,
    actorUserId?: string,
  ) {
    if (!file) {
      throw new BadRequestException({
        message: 'File is required',
        code: 'CANDIDATE_DOCUMENT_FILE_REQUIRED',
      });
    }

    this.validationHelper.ensureLatestFlagValid({
      document_type: dto.document_type,
      is_latest: dto.is_latest,
    });

    this.validationHelper.ensureFileAllowed({
      document_type: dto.document_type,
      mime_type: file.mimetype,
      file_name: file.originalname,
      file_size: file.size,
    });

    return this.dataSource.transaction(async (manager) => {
      const candidate = await this.candidateRepository.findById(candidateId, {
        manager,
      });

      if (!candidate) {
        throw new NotFoundException({
          message: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      const isLatest = dto.is_latest ?? false;
      if (dto.document_type === CandidateDocumentType.RESUME && isLatest) {
        await this.candidateDocumentRepository.unsetLatestResume({
          candidateId,
          manager,
        });
      }

      const fileUrl = `/uploads/candidates/${candidateId}/${file.filename}`;

      return this.candidateDocumentRepository.createAndSave(
        {
          candidate_id: candidateId,
          document_type: dto.document_type,
          file_name: file.originalname,
          file_url: fileUrl,
          file_size: String(file.size),
          mime_type: file.mimetype,
          uploaded_at: new Date(),
          is_latest: isLatest,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: actorUserId ?? null,
        },
        { manager },
      );
    });
  }
}
