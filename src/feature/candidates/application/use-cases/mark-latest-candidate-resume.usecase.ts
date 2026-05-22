import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CandidateDocumentType } from '../../enums/candidate-document-type.enum';
import { CandidateDocumentRepository } from '../../repositories/candidate-document.repository';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class MarkLatestCandidateResumeUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    candidateId: string,
    documentId: string,
    actorUserId?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
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

      const saved = await this.candidateDocumentRepository.save(doc, { manager });

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.CANDIDATE,
            entityId: candidateId,
            actionType: ActivityActionType.UPDATE,
            actorUserId,
            oldValues: { changed_fields: ['resume_latest'] },
            newValues: { changed_fields: ['resume_latest'], latest_document_id: saved.id },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      return saved;
    });
  }
}
