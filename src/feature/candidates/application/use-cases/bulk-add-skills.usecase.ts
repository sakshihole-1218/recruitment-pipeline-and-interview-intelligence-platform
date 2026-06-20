import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HttpException } from '@nestjs/common';

import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateSkillRepository } from '../../repositories/candidate-skill.repository';
import { CandidateReferenceRepository } from '../../repositories/candidate-reference.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';

export type BulkAddSkillsFailure = {
  candidate_id?: string;
  message: string;
  code: string;
  details?: unknown;
};

export type BulkAddSkillsCandidateResult = {
  candidate_id: string;
  added_skill_ids: string[];
  reactivated_skill_ids: string[];
  skipped_existing_skill_ids: string[];
};

export type BulkAddSkillsResult = {
  invalid_skill_ids: string[];
  results: BulkAddSkillsCandidateResult[];
  failed: BulkAddSkillsFailure[];
};

@Injectable()
export class BulkAddSkillsUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateSkillRepository: CandidateSkillRepository,
    private readonly referenceRepository: CandidateReferenceRepository,
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
  ): BulkAddSkillsFailure {
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

  async execute(options: {
    candidateIds: unknown[];
    skillIds: unknown[];
    actorUserId?: string;
  }): Promise<BulkAddSkillsResult> {
    const failed: BulkAddSkillsFailure[] = [];
    const results: BulkAddSkillsCandidateResult[] = [];

    const rawSkillIds = Array.isArray(options.skillIds) ? options.skillIds : [];
    const rawCandidateIds = Array.isArray(options.candidateIds)
      ? options.candidateIds
      : [];

    const invalidSkillIds = new Set<string>();
    const dedupedSkillIds: string[] = [];
    {
      const seen = new Set<string>();
      for (const raw of rawSkillIds) {
        const id = String(raw ?? '').trim();
        if (!id) continue;
        if (!BulkAddSkillsUseCase.isUuid(id)) {
          invalidSkillIds.add(id);
          continue;
        }
        if (seen.has(id)) continue;
        seen.add(id);
        dedupedSkillIds.push(id);
      }
    }

    const existingSkills = await this.referenceRepository.findSkillsByIds(
      dedupedSkillIds,
      this.dataSource.manager,
    );
    const existingSkillIds = new Set(existingSkills.map((s) => s.id));

    for (const id of dedupedSkillIds) {
      if (!existingSkillIds.has(id)) {
        invalidSkillIds.add(id);
      }
    }

    const validSkillIds = dedupedSkillIds.filter((id) =>
      existingSkillIds.has(id),
    );

    const seenCandidates = new Set<string>();
    for (const raw of rawCandidateIds) {
      const candidateId = String(raw ?? '').trim();

      if (!BulkAddSkillsUseCase.isUuid(candidateId)) {
        failed.push({
          candidate_id: candidateId || undefined,
          message: 'Invalid candidate_id format',
          code: 'INVALID_CANDIDATE_ID',
        });
        continue;
      }

      if (seenCandidates.has(candidateId)) {
        failed.push({
          candidate_id: candidateId,
          message: 'Duplicate candidate_id in request payload',
          code: 'DUPLICATE_CANDIDATE_ID_IN_REQUEST',
        });
        continue;
      }
      seenCandidates.add(candidateId);

      if (!validSkillIds.length) {
        failed.push({
          candidate_id: candidateId,
          message: 'No valid skill_ids to apply',
          code: 'NO_VALID_SKILL_IDS',
          details: { invalid_skill_ids: Array.from(invalidSkillIds) },
        });
        continue;
      }

      try {
        const perCandidate = await this.dataSource.transaction(
          async (manager) => {
            const candidate =
              await this.candidateRepository.findByIdIncludingDeleted(
                candidateId,
                {
                  manager,
                },
              );
            if (!candidate) {
              return {
                kind: 'fail' as const,
                failure: {
                  message: 'Candidate not found',
                  code: 'CANDIDATE_NOT_FOUND',
                },
              };
            }
            if (candidate.deleted_at) {
              return {
                kind: 'fail' as const,
                failure: {
                  message: 'Candidate is deleted and was skipped',
                  code: 'CANDIDATE_DELETED_SKIPPED',
                },
              };
            }

            const existingMappings =
              await this.candidateSkillRepository.findByCandidateAndSkillIds({
                candidateId,
                skillIds: validSkillIds,
                includeDeleted: true,
                manager,
              });

            const bySkillId = new Map(
              existingMappings.map((m) => [m.skill_id, m] as const),
            );

            const added: string[] = [];
            const reactivated: string[] = [];
            const skipped: string[] = [];

            for (const skillId of validSkillIds) {
              const existing = bySkillId.get(skillId);
              if (!existing) {
                await this.candidateSkillRepository.createAndSave(
                  {
                    candidate_id: candidateId,
                    skill_id: skillId,
                    years_of_experience: null,
                    proficiency_level: null,
                    is_primary: false,
                    deleted_at: null,
                  },
                  { manager },
                );
                added.push(skillId);
                continue;
              }

              if (existing.deleted_at) {
                existing.deleted_at = null;
                await this.candidateSkillRepository.save(existing, { manager });
                reactivated.push(skillId);
                continue;
              }

              skipped.push(skillId);
            }

            if (options.actorUserId) {
              await this.activityWriter.log(
                ActivityLogBuilder.build({
                  entityType: ActivityEntityType.CANDIDATE,
                  entityId: candidateId,
                  actionType: ActivityActionType.UPDATE,
                  actorUserId: options.actorUserId,
                  oldValues: { changed_fields: ['skills'] },
                  newValues: {
                    changed_fields: ['skills'],
                    added_skill_ids: added,
                    reactivated_skill_ids: reactivated,
                  },
                  actionAt: new Date(),
                  ipAddress: null,
                  userAgent: null,
                }),
                { manager },
              );
            }

            return {
              kind: 'ok' as const,
              result: {
                candidate_id: candidateId,
                added_skill_ids: added,
                reactivated_skill_ids: reactivated,
                skipped_existing_skill_ids: skipped,
              },
            };
          },
        );

        if (perCandidate.kind === 'fail') {
          failed.push({
            candidate_id: candidateId,
            message: perCandidate.failure.message,
            code: perCandidate.failure.code,
          });
          continue;
        }

        results.push(perCandidate.result);
      } catch (error) {
        failed.push(BulkAddSkillsUseCase.toFailure(error, candidateId));
      }
    }

    return {
      invalid_skill_ids: Array.from(invalidSkillIds),
      results,
      failed,
    };
  }
}
