import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HttpException } from '@nestjs/common';

import { CreateCandidateDto } from '../../dto/create-candidate.dto';
import { CandidateEntity } from '../../entities/candidate.entity';
import { CreateCandidateUseCase } from './create-candidate.usecase';

export type BulkCreateCandidatesFailure = {
  index: number;
  email?: string;
  message: string;
  code: string;
  details?: unknown;
};

export type BulkCreateCandidatesResult = {
  created: CandidateEntity[];
  failed: BulkCreateCandidatesFailure[];
};

@Injectable()
export class BulkCreateCandidatesUseCase {
  constructor(private readonly createCandidate: CreateCandidateUseCase) {}

  private static toFailure(options: {
    index: number;
    email?: string;
    error: unknown;
  }): BulkCreateCandidatesFailure {
    const email = options.email;

    if (options.error instanceof HttpException) {
      const res = options.error.getResponse();
      const obj =
        typeof res === 'object' && res !== null
          ? (res as Record<string, unknown>)
          : {};
      return {
        index: options.index,
        email,
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
      index: options.index,
      email,
      message:
        options.error instanceof Error
          ? options.error.message
          : 'Request failed',
      code: 'REQUEST_FAILED',
    };
  }

  private static async validateItem(
    index: number,
    input: unknown,
  ): Promise<
    | {
        ok: true;
        dto: CreateCandidateDto;
      }
    | {
        ok: false;
        failure: BulkCreateCandidatesFailure;
      }
  > {
    const plain = typeof input === 'object' && input !== null ? input : {};

    const dto = plainToInstance(CreateCandidateDto, plain, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });

    if (dto && typeof dto === 'object') {
      Object.setPrototypeOf(dto, CreateCandidateDto.prototype);
    }

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    });

    if (errors.length) {
      const messages = errors
        .flatMap((e) => (e.constraints ? Object.values(e.constraints) : []))
        .filter(Boolean);

      return {
        ok: false,
        failure: {
          index,
          email:
            typeof (dto as any)?.email === 'string'
              ? (dto as any).email
              : undefined,
          message: 'Validation failed',
          code: 'VALIDATION_FAILED',
          details: messages.length ? messages : errors,
        },
      };
    }

    return { ok: true, dto };
  }

  async execute(
    candidates: unknown[],
    actorUserId?: string,
  ): Promise<BulkCreateCandidatesResult> {
    const created: CandidateEntity[] = [];
    const failed: BulkCreateCandidatesFailure[] = [];

    const input = Array.isArray(candidates) ? candidates : [];
    const seenEmails = new Set<string>();

    for (let index = 0; index < input.length; index += 1) {
      const item = input[index];

      const validated = await BulkCreateCandidatesUseCase.validateItem(
        index,
        item,
      );
      if (!validated.ok) {
        failed.push(validated.failure);
        continue;
      }

      const email = String(validated.dto.email ?? '')
        .trim()
        .toLowerCase();
      if (email) {
        if (seenEmails.has(email)) {
          failed.push({
            index,
            email,
            message: 'Duplicate email in request payload',
            code: 'DUPLICATE_EMAIL_IN_REQUEST',
          });
          continue;
        }
        seenEmails.add(email);
      }

      try {
        const result = await this.createCandidate.execute(
          validated.dto,
          actorUserId,
        );
        created.push(result);
      } catch (error) {
        failed.push(
          BulkCreateCandidatesUseCase.toFailure({
            index,
            email,
            error,
          }),
        );
      }
    }

    return { created, failed };
  }
}
