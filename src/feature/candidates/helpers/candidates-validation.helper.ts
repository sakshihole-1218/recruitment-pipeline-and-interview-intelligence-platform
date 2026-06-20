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

  async ensureUniquePhone(options: {
    phone: string;
    excludeId?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const normalized = normalizePhoneE164(options.phone);
    if (!normalized) {
      return;
    }

    const existing = await this.candidateRepository.findByPhone(normalized, {
      includeDeleted: true,
      manager: options.manager,
    });

    if (existing && existing.id !== options.excludeId && !existing.deleted_at) {
      throw new ConflictException({
        message: 'A candidate with this phone number already exists',
        code: 'CANDIDATE_PHONE_ALREADY_EXISTS',
      });
    }
  }

  dedupeAndValidateSkills(
    inputs: CandidateSkillInputDto[],
  ): CandidateSkillInputDto[] {
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

  ensureLatestFlagValid(options: {
    document_type: CandidateDocumentType;
    is_latest?: boolean;
  }): void {
    if (
      options.is_latest &&
      options.document_type !== CandidateDocumentType.RESUME
    ) {
      throw new BadRequestException({
        message: 'is_latest is only supported for RESUME documents',
        code: 'CANDIDATE_DOCUMENT_LATEST_UNSUPPORTED_TYPE',
      });
    }
  }

  ensureFileAllowed(options: {
    document_type: CandidateDocumentType;
    mime_type: string;
    file_name: string;
    file_size: number;
  }): void {
    const fallback = 25 * 1024 * 1024; // 25MB
    const raw = Number(process.env.CANDIDATE_DOCUMENT_MAX_BYTES);
    const maxBytes = Number.isFinite(raw) && raw > 0 ? raw : fallback;
    const maxMb = Math.max(1, Math.round(maxBytes / (1024 * 1024)));

    if (!Number.isFinite(options.file_size) || options.file_size <= 0) {
      throw new BadRequestException({
        message: 'Invalid file size',
        code: 'CANDIDATE_DOCUMENT_INVALID_FILE_SIZE',
      });
    }
    if (options.file_size > maxBytes) {
      throw new BadRequestException({
        message: `File too large (max ${maxMb}MB)`,
        code: 'CANDIDATE_DOCUMENT_FILE_TOO_LARGE',
      });
    }

    const mime = String(options.mime_type ?? '')
      .trim()
      .toLowerCase();
    const name = String(options.file_name ?? '')
      .trim()
      .toLowerCase();

    const allowedCommon = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
    ]);

    if (!allowedCommon.has(mime)) {
      throw new BadRequestException({
        message: 'Unsupported file type',
        code: 'CANDIDATE_DOCUMENT_UNSUPPORTED_MIME_TYPE',
      });
    }

    if (options.document_type === CandidateDocumentType.ID_PROOF) {
      if (!mime.startsWith('image/') && mime !== 'application/pdf') {
        throw new BadRequestException({
          message: 'ID_PROOF supports only images or PDF',
          code: 'CANDIDATE_DOCUMENT_INVALID_ID_PROOF_TYPE',
        });
      }
    }

    if (options.document_type === CandidateDocumentType.RESUME) {
      const ok =
        mime === 'application/pdf' ||
        mime === 'application/msword' ||
        mime ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (!ok) {
        throw new BadRequestException({
          message: 'RESUME supports only PDF/DOC/DOCX',
          code: 'CANDIDATE_DOCUMENT_INVALID_RESUME_TYPE',
        });
      }
    }

    if (!name) {
      throw new BadRequestException({
        message: 'Invalid file name',
        code: 'CANDIDATE_DOCUMENT_INVALID_FILE_NAME',
      });
    }
  }
}
