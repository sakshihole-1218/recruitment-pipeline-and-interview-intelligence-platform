import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { JobOpeningEntity } from '../../../job-openings/entities/job-opening.entity';
import { CreateInterviewRoundDto } from '../../dto/create-interview-round.dto';
import { InterviewRoundEntity } from '../../entities/interview-round.entity';
import { InterviewRoundRepository } from '../../repositories/interview-round.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CreateInterviewRoundUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRoundRepository: InterviewRoundRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    dto: CreateInterviewRoundDto,
    actorUserId?: string,
  ): Promise<InterviewRoundEntity> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
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
      const description = dto.description
        ? String(dto.description).trim()
        : null;

      const existing =
        await this.interviewRoundRepository.findByJobOpeningAndSequence(
          dto.job_opening_id,
          dto.sequence_number,
          { includeDeleted: true, manager },
        );

      if (existing) {
        if (!existing.deleted_at) {
          throw new ConflictException({
            message:
              'An interview round with this sequence number already exists for this job opening',
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
        existing.updated_by_user_id =
          actorUserId ?? existing.updated_by_user_id;

        await this.interviewRoundRepository.save(existing, { manager });

        const restored = await this.interviewRoundRepository.findById(
          existing.id,
          { manager },
        );
        if (!restored) {
          throw new ConflictException({
            message: 'We could not complete the request. Please try again',
            code: 'INTERVIEW_ROUND_POST_CREATE_LOAD_FAILED',
          });
        }

        if (actorUserId) {
          await this.activityWriter.log(
            ActivityLogBuilder.build({
              entityType: ActivityEntityType.JOB_OPENING,
              entityId: restored.job_opening_id,
              actionType: ActivityActionType.UPDATE,
              actorUserId,
              oldValues: { round_id: restored.id, deleted_at_present: true },
              newValues: {
                round_id: restored.id,
                sequence_number: restored.sequence_number,
                round_type: restored.round_type,
                is_mandatory: restored.is_mandatory,
                max_score: restored.max_score,
                deleted_at_present: false,
                changed_fields: ['interview_rounds'],
              },
              actionAt: now,
              ipAddress: null,
              userAgent: null,
            }),
            { manager },
          );
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

      const loaded = await this.interviewRoundRepository.findById(created.id, {
        manager,
      });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_ROUND_POST_CREATE_LOAD_FAILED',
        });
      }

      if (actorUserId) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.JOB_OPENING,
            entityId: dto.job_opening_id,
            actionType: ActivityActionType.CREATE,
            actorUserId,
            oldValues: null,
            newValues: {
              round_id: loaded.id,
              sequence_number: loaded.sequence_number,
              round_type: loaded.round_type,
              is_mandatory: loaded.is_mandatory,
              max_score: loaded.max_score,
              changed_fields: ['interview_rounds'],
            },
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      return loaded;
    });
  }
}
