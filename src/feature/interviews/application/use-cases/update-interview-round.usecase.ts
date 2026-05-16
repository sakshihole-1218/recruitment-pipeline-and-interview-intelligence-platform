import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateInterviewRoundDto } from '../../dto/update-interview-round.dto';
import { InterviewRoundEntity } from '../../entities/interview-round.entity';
import { InterviewRoundRepository } from '../../repositories/interview-round.repository';

@Injectable()
export class UpdateInterviewRoundUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRoundRepository: InterviewRoundRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateInterviewRoundDto,
    actorUserId?: string,
  ): Promise<InterviewRoundEntity> {
    return this.dataSource.transaction(async (manager) => {
      const round = await this.interviewRoundRepository.findById(id, { manager });

      if (!round) {
        throw new NotFoundException({
          message: 'Interview round not found',
          code: 'INTERVIEW_ROUND_NOT_FOUND',
        });
      }

      if (
        typeof dto.sequence_number === 'number' &&
        dto.sequence_number !== round.sequence_number
      ) {
        const existing = await this.interviewRoundRepository.findByJobOpeningAndSequence(
          round.job_opening_id,
          dto.sequence_number,
          { includeDeleted: true, manager },
        );

        if (existing && existing.id !== round.id && !existing.deleted_at) {
          throw new ConflictException({
            message: 'An interview round with this sequence number already exists for this job opening',
            code: 'INTERVIEW_ROUND_SEQUENCE_ALREADY_EXISTS',
          });
        }

        if (existing && existing.id !== round.id && existing.deleted_at) {
          throw new ConflictException({
            message: 'A deleted round already exists with this sequence number. Restore it instead of creating another',
            code: 'INTERVIEW_ROUND_SEQUENCE_CONFLICT_DELETED',
          });
        }

        round.sequence_number = dto.sequence_number;
      }

      if (dto.round_name !== undefined) {
        round.round_name = String(dto.round_name).trim();
      }

      if (dto.round_type !== undefined) {
        round.round_type = dto.round_type;
      }

      if (dto.is_mandatory !== undefined) {
        round.is_mandatory = dto.is_mandatory;
      }

      if (dto.max_score !== undefined) {
        round.max_score = dto.max_score ?? null;
      }

      if (dto.description !== undefined) {
        round.description = dto.description ? String(dto.description).trim() : null;
      }

      round.updated_by_user_id = actorUserId ?? round.updated_by_user_id;

      await this.interviewRoundRepository.save(round, { manager });

      const loaded = await this.interviewRoundRepository.findById(round.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_ROUND_POST_UPDATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
