import { Injectable } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

import { CandidateRepository } from '../../repositories/candidate.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';

export type BulkUpdateCandidateStatusFailure = {
  candidate_id?: string;
  message: string;
  code: string;
  details?: unknown;
};

export type BulkUpdateCandidateStatusResult = {
  updated: Array<{ candidate_id: string; is_active: boolean }>;
  failed: BulkUpdateCandidateStatusFailure[];
};

@Injectable()
export class BulkUpdateCandidateStatusUseCase {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  private static isUuid(value: unknown): boolean {
    const v = String(value ?? '').trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    );
  }

  private static toFailure(
    error: unknown,
    candidateId?: string,
  ): BulkUpdateCandidateStatusFailure {
    if (error instanceof HttpException) {
      const res = error.getResponse();
      const obj =
        typeof res === 'object' && res !== null
          ? (res as Record<string, unknown>)
          : {};
      return {
        candidate_id: candidateId,
        message:
          typeof obj.message === 'string'
            ? obj.message
            : typeof res === 'string'
              ? res
              : 'Request failed',
        code: typeof obj.code === 'string' ? obj.code : 'REQUEST_FAILED',
        details: obj,
      };
    }

    return {
      candidate_id: candidateId,
      message: error instanceof Error ? error.message : 'Request failed',
      code: 'REQUEST_FAILED',
    };
  }

  async execute(
    candidateIds: unknown[],
    isActive: boolean,
    actorUserId?: string,
  ): Promise<BulkUpdateCandidateStatusResult> {
    const updated: Array<{ candidate_id: string; is_active: boolean }> = [];
    const failed: BulkUpdateCandidateStatusFailure[] = [];

    const input = Array.isArray(candidateIds) ? candidateIds : [];
    const seen = new Set<string>();

    for (const raw of input) {
      const candidateId = String(raw ?? '').trim();

      if (!BulkUpdateCandidateStatusUseCase.isUuid(candidateId)) {
        failed.push({
          candidate_id: candidateId || undefined,
          message: 'Invalid candidate_id format',
          code: 'INVALID_CANDIDATE_ID',
        });
        continue;
      }

      if (seen.has(candidateId)) {
        failed.push({
          candidate_id: candidateId,
          message: 'Duplicate candidate_id in request payload',
          code: 'DUPLICATE_CANDIDATE_ID_IN_REQUEST',
        });
        continue;
      }
      seen.add(candidateId);

      try {
        const candidate =
          await this.candidateRepository.findByIdIncludingDeleted(candidateId);
        if (!candidate) {
          failed.push({
            candidate_id: candidateId,
            message: 'Candidate not found',
            code: 'CANDIDATE_NOT_FOUND',
          });
          continue;
        }

        if (candidate.deleted_at) {
          failed.push({
            candidate_id: candidateId,
            message: 'Candidate is deleted and was skipped',
            code: 'CANDIDATE_DELETED_SKIPPED',
          });
          continue;
        }

        candidate.is_active = isActive;
        if (actorUserId) {
          candidate.updated_by_user_id = actorUserId;
        }

        await this.candidateRepository.save(candidate);

        if (actorUserId) {
          await this.activityWriter.log(
            ActivityLogBuilder.build({
              entityType: ActivityEntityType.CANDIDATE,
              entityId: candidateId,
              actionType: ActivityActionType.UPDATE,
              actorUserId,
              oldValues: { changed_fields: ['is_active'] },
              newValues: { changed_fields: ['is_active'], is_active: isActive },
              ipAddress: null,
              userAgent: null,
            }),
          );
        }

        updated.push({ candidate_id: candidateId, is_active: isActive });
      } catch (error) {
        failed.push(
          BulkUpdateCandidateStatusUseCase.toFailure(error, candidateId),
        );
      }
    }

    return { updated, failed };
  }
}
