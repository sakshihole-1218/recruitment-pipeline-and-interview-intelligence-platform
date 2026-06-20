import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { EndLiveKitRoomDto } from '../../dto/end-livekit-room.dto';
import { LivekitRoomSessionEntity } from '../../entities/livekit-room-session.entity';
import { LivekitRoomStatus } from '../../enums/livekit-room-status.enum';
import { LivekitIntegrationValidationHelper } from '../../helpers/livekit-integration-validation.helper';
import { LivekitProvider } from '../../providers/livekit.provider';
import { LivekitIntegrationReferenceRepository } from '../../repositories/livekit-integration-reference.repository';
import { LivekitRoomSessionRepository } from '../../repositories/livekit-room-session.repository';

@Injectable()
export class EndLiveKitRoomUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly roomRepository: LivekitRoomSessionRepository,
    private readonly referenceRepository: LivekitIntegrationReferenceRepository,
    private readonly validation: LivekitIntegrationValidationHelper,
    private readonly livekitProvider: LivekitProvider,
  ) {}

  async execute(
    dto: EndLiveKitRoomDto,
    actorUserId?: string,
  ): Promise<LivekitRoomSessionEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

    const roomSession = await this.dataSource.transaction(async (manager) => {
      const session = await this.referenceRepository.findAiInterviewSessionById(
        dto.ai_interview_session_id,
        { manager, lockForUpdate: true },
      );

      if (!session) {
        throw new NotFoundException({
          message: 'AI interview session not found',
          code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
        });
      }

      const room = await this.roomRepository.findByAiInterviewSessionId(
        session.id,
        {
          manager,
          lockForUpdate: true,
        },
      );

      if (!room) {
        throw new NotFoundException({
          message: 'LiveKit room session not found',
          code: 'LIVEKIT_ROOM_SESSION_NOT_FOUND',
        });
      }

      this.validation.ensureRoomCanBeEnded(room.room_status);

      if (room.room_status === LivekitRoomStatus.ENDED) {
        return room;
      }

      return room;
    });

    if (roomSession.room_status !== LivekitRoomStatus.ENDED) {
      try {
        await this.livekitProvider.deleteRoom(roomSession.room_name);
      } catch (error) {}
    }

    return this.dataSource.transaction(async (manager) => {
      const room = await this.roomRepository.findById(roomSession.id, {
        manager,
        lockForUpdate: true,
      });

      if (!room) {
        throw new NotFoundException({
          message: 'LiveKit room session not found',
          code: 'LIVEKIT_ROOM_SESSION_NOT_FOUND',
        });
      }

      if (room.room_status === LivekitRoomStatus.ENDED) {
        return room;
      }

      const now = new Date();
      room.room_status = LivekitRoomStatus.ENDED;
      room.room_ended_at = room.room_ended_at || now;
      room.last_webhook_event_at = now;
      room.updated_by_user_id = actorUserId;
      room.metadata = {
        ...(room.metadata || {}),
        end_reason: dto.reason || null,
        ended_by_user_id: actorUserId,
        ended_manually_at: now.toISOString(),
      };

      return this.roomRepository.updateRoomSession(room, { manager });
    });
  }
}
