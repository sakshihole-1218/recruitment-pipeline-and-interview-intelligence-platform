import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateInterviewRoundDto } from '../../dto/update-interview-round.dto';
import { InterviewRoundEntity } from '../../entities/interview-round.entity';
import { InterviewRoundRepository } from '../../repositories/interview-round.repository';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class UpdateInterviewRoundUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRoundRepository: InterviewRoundRepository,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    id: string,
    dto: UpdateInterviewRoundDto,
    actorUserId?: string,
  ): Promise<InterviewRoundEntity> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const round = await this.interviewRoundRepository.findById(id, {
        manager,
      });

      if (!round) {
        throw new NotFoundException({
          message: 'Interview round not found',
          code: 'INTERVIEW_ROUND_NOT_FOUND',
        });
      }

      const changedFields: string[] = [];

      if (
        typeof dto.sequence_number === 'number' &&
        dto.sequence_number !== round.sequence_number
      ) {
        const existing =
          await this.interviewRoundRepository.findByJobOpeningAndSequence(
            round.job_opening_id,
            dto.sequence_number,
            { includeDeleted: true, manager },
          );

        if (existing && existing.id !== round.id && !existing.deleted_at) {
          throw new ConflictException({
            message:
              'An interview round with this sequence number already exists for this job opening',
            code: 'INTERVIEW_ROUND_SEQUENCE_ALREADY_EXISTS',
          });
        }

        if (existing && existing.id !== round.id && existing.deleted_at) {
          throw new ConflictException({
            message:
              'A deleted round already exists with this sequence number. Restore it instead of creating another',
            code: 'INTERVIEW_ROUND_SEQUENCE_CONFLICT_DELETED',
          });
        }

        round.sequence_number = dto.sequence_number;
        changedFields.push('sequence_number');
      }

      if (dto.round_name !== undefined) {
        round.round_name = String(dto.round_name).trim();
        changedFields.push('round_name');
      }

      if (dto.round_type !== undefined) {
        round.round_type = dto.round_type;
        changedFields.push('round_type');
      }

      if (dto.is_mandatory !== undefined) {
        round.is_mandatory = dto.is_mandatory;
        changedFields.push('is_mandatory');
      }

      if (dto.max_score !== undefined) {
        round.max_score = dto.max_score ?? null;
        changedFields.push('max_score');
      }

      if (dto.description !== undefined) {
        round.description = dto.description
          ? String(dto.description).trim()
          : null;
        changedFields.push('description');
      }

      round.updated_by_user_id = actorUserId ?? round.updated_by_user_id;

      await this.interviewRoundRepository.save(round, { manager });

      const loaded = await this.interviewRoundRepository.findById(round.id, {
        manager,
      });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_ROUND_POST_UPDATE_LOAD_FAILED',
        });
      }

      if (actorUserId && changedFields.length) {
        await this.activityWriter.log(
          ActivityLogBuilder.build({
            entityType: ActivityEntityType.JOB_OPENING,
            entityId: loaded.job_opening_id,
            actionType: ActivityActionType.UPDATE,
            actorUserId,
            oldValues: { round_id: loaded.id },
            newValues: { round_id: loaded.id, changed_fields: changedFields },
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
