import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CandidateEntity } from '../../entities/candidate.entity';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateSkillRepository } from '../../repositories/candidate-skill.repository';
import { CandidateDocumentRepository } from '../../repositories/candidate-document.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class SoftDeleteCandidateUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateSkillRepository: CandidateSkillRepository,
    private readonly candidateDocumentRepository: CandidateDocumentRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const candidate = await this.candidateRepository.findById(id, { manager });
      if (!candidate) {
        throw new NotFoundException({
          message: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      await manager
        .getRepository(CandidateEntity)
        .createQueryBuilder()
        .update(CandidateEntity)
        .set({
          deleted_at: now,
          deleted_by_user_id: actorUserId ?? null,
          is_active: false,
          updated_at: now,
          updated_by_user_id: actorUserId ?? null,
        })
        .where('id = :id', { id })
        .andWhere('deleted_at IS NULL')
        .execute();

      await this.candidateSkillRepository.softDeleteByCandidateId(id, { manager });
      await this.candidateDocumentRepository.softDeleteByCandidateId(id, { manager });

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.CANDIDATE,
            entityId: candidate.id,
            actionType: ActivityActionType.DELETE,
            actorUserId,
            oldValues: { deleted_at: null },
            newValues: { deleted_at: now.toISOString() },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }
    });
  }
}
