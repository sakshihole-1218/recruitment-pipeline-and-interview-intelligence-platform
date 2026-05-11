import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import {
  normalizeEmail,
  normalizePhoneE164,
} from '../../../common/utils/normalization.util';
import { CandidateRepository } from '../repositories/candidate.repository';
import { CandidateDocumentType } from '../enums/candidate-document-type.enum';
import { CandidateSkillInputDto } from '../dto/candidate-skill.input.dto';

@Injectable()
export class CandidatesValidationHelper {
  constructor(private readonly candidateRepository: CandidateRepository) {}

  normalizeEmail(email: unknown): string {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      throw new BadRequestException({
        message: 'Candidate email is required',
        code: 'CANDIDATE_EMAIL_REQUIRED',
      });
    }
    return normalized;
  }

  normalizePhone(phone: unknown): string | null {
    return normalizePhoneE164(phone);
  }

  async ensureUniqueEmail(options: {
    email: string;
    excludeId?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const existing = await this.candidateRepository.findByEmail(options.email, {
      includeDeleted: true,
      manager: options.manager,
    });

    if (existing && existing.id !== options.excludeId && !existing.deleted_at) {
      throw new ConflictException({
        message: 'A candidate with this email already exists',
        code: 'CANDIDATE_EMAIL_ALREADY_EXISTS',
      });
    }
  }

  dedupeAndValidateSkills(inputs: CandidateSkillInputDto[]): CandidateSkillInputDto[] {
    const list = Array.isArray(inputs) ? inputs : [];

    const seen = new Set<string>();
    const deduped: CandidateSkillInputDto[] = [];

    for (const item of list) {
      const skillId = String(item?.skill_id ?? '').trim();
      if (!skillId) {
        throw new BadRequestException({
          message: 'skill_id is required for each skill entry',
          code: 'CANDIDATE_SKILL_ID_REQUIRED',
        });
      }

      if (seen.has(skillId)) {
        continue;
      }

      seen.add(skillId);
      deduped.push(item);
    }

    return deduped;
  }

  ensureLatestFlagValid(options: { document_type: CandidateDocumentType; is_latest?: boolean }): void {
    if (options.is_latest && options.document_type !== CandidateDocumentType.RESUME) {
      throw new BadRequestException({
        message: 'is_latest is only supported for RESUME documents',
        code: 'CANDIDATE_DOCUMENT_LATEST_UNSUPPORTED_TYPE',
      });
    }
  }
}
