import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateAiInterviewSessionDto } from '../../dto/update-ai-interview-session.dto';
import { AiInterviewSessionEntity } from '../../entities/ai-interview-session.entity';
import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';
import { AiInterviewSessionsValidationHelper } from '../../helpers/ai-interview-sessions-validation.helper';
import { AiInterviewSessionStatus } from '../../enums/ai-interview-session-status.enum';

@Injectable()
export class UpdateAiInterviewSessionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewSessionRepository,
    private readonly validation: AiInterviewSessionsValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: UpdateAiInterviewSessionDto,
    actorUserId?: string,
  ): Promise<AiInterviewSessionEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

    const hasAny = Object.values(dto || {}).some((v) => v !== undefined);
    if (!hasAny) {
      throw new BadRequestException({
        message: 'No fields provided to update',
        code: 'AI_SESSION_UPDATE_EMPTY',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();

      const session = await this.repository.findById(id, {
        manager,
        lockForUpdate: true,
      });

      if (!session) {
        throw new NotFoundException({
          message: 'AI interview session not found',
          code: 'AI_SESSION_NOT_FOUND',
        });
      }

      if (dto.session_status) {
        if (
          [
            AiInterviewSessionStatus.COMPLETED,
            AiInterviewSessionStatus.CANCELLED,
            AiInterviewSessionStatus.FAILED,
          ].includes(session.session_status) &&
          dto.session_status !== session.session_status
        ) {
          throw new ConflictException({
            message: 'Terminal AI interview session status cannot be changed',
            code: 'AI_SESSION_STATUS_TERMINAL',
            meta: { session_status: session.session_status },
          });
        }

        if (dto.session_status !== session.session_status) {
          this.validation.ensureSessionStatusTransition({
            from: session.session_status,
            to: dto.session_status,
          });
        }

        session.session_status = dto.session_status;
      }

      if (dto.livekit_room_name !== undefined) {
        session.livekit_room_name = dto.livekit_room_name?.trim() || null;
      }

      if (dto.question_generation_status) {
        session.question_generation_status = dto.question_generation_status;
      }

      if (dto.feedback_generation_status) {
        session.feedback_generation_status = dto.feedback_generation_status;
      }

      if (dto.failure_reason !== undefined) {
        session.failure_reason = dto.failure_reason?.trim() || null;
      }

      // If status updated to COMPLETED and ended_at isn't set, set it
      if (
        session.session_status === AiInterviewSessionStatus.COMPLETED &&
        !session.ended_at
      ) {
        session.ended_at = now;
        session.duration_seconds = session.started_at
          ? Math.max(
              0,
              Math.floor((now.getTime() - session.started_at.getTime()) / 1000),
            )
          : session.duration_seconds;
      }

      session.updated_by_user_id = actorUserId;
      return this.repository.updateSession(session, { manager });
    });
  }
}
