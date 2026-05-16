import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { JobOpeningEntity } from '../../../job-openings/entities/job-opening.entity';
import { CreateInterviewRoundDto } from '../../dto/create-interview-round.dto';
import { InterviewRoundEntity } from '../../entities/interview-round.entity';
import { InterviewRoundRepository } from '../../repositories/interview-round.repository';

@Injectable()
export class CreateInterviewRoundUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRoundRepository: InterviewRoundRepository,
  ) {}

  async execute(dto: CreateInterviewRoundDto, actorUserId?: string): Promise<InterviewRoundEntity> {
    return this.dataSource.transaction(async (manager) => {
      const jobOpening = await manager
        .getRepository(JobOpeningEntity)
        .createQueryBuilder('job_openings')
        .where('job_openings.id = :id', { id: dto.job_opening_id })
        .andWhere('job_openings.deleted_at IS NULL')
        .getOne();

      if (!jobOpening) {
        throw new NotFoundException({
          message: 'Job opening not found',
          code: 'JOB_OPENING_NOT_FOUND',
        });
      }

      const roundName = String(dto.round_name ?? '').trim();
      const description = dto.description ? String(dto.description).trim() : null;

      const existing = await this.interviewRoundRepository.findByJobOpeningAndSequence(
        dto.job_opening_id,
        dto.sequence_number,
        { includeDeleted: true, manager },
      );

      if (existing) {
        if (!existing.deleted_at) {
          throw new ConflictException({
            message: 'An interview round with this sequence number already exists for this job opening',
            code: 'INTERVIEW_ROUND_SEQUENCE_ALREADY_EXISTS',
          });
        }

        existing.round_name = roundName;
        existing.round_type = dto.round_type;
        existing.is_mandatory = dto.is_mandatory ?? true;
        existing.max_score = dto.max_score ?? null;
        existing.description = description;
        existing.deleted_at = null;
        existing.deleted_by_user_id = null;
        existing.updated_by_user_id = actorUserId ?? existing.updated_by_user_id;

        await this.interviewRoundRepository.save(existing, { manager });

        const restored = await this.interviewRoundRepository.findById(existing.id, { manager });
        if (!restored) {
          throw new ConflictException({
            message: 'We could not complete the request. Please try again',
            code: 'INTERVIEW_ROUND_POST_CREATE_LOAD_FAILED',
          });
        }

        return restored;
      }

      const created = await this.interviewRoundRepository.createAndSave(
        {
          job_opening_id: dto.job_opening_id,
          round_name: roundName,
          round_type: dto.round_type,
          sequence_number: dto.sequence_number,
          is_mandatory: dto.is_mandatory ?? true,
          max_score: dto.max_score ?? null,
          description,
          created_by_user_id: actorUserId ?? null,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const loaded = await this.interviewRoundRepository.findById(created.id, { manager });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_ROUND_POST_CREATE_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
