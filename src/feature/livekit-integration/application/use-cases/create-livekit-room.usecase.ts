import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AiInterviewSessionStatus } from '../../../aiInterviewSessions/enums/ai-interview-session-status.enum';

import { CreateLiveKitRoomDto } from '../../dto/create-livekit-room.dto';
import { LivekitRoomSessionEntity } from '../../entities/livekit-room-session.entity';
import { LivekitRoomStatus } from '../../enums/livekit-room-status.enum';
import { LivekitIntegrationValidationHelper } from '../../helpers/livekit-integration-validation.helper';
import { LivekitProvider } from '../../providers/livekit.provider';
import { LivekitIntegrationReferenceRepository } from '../../repositories/livekit-integration-reference.repository';
import { LivekitRoomSessionRepository } from '../../repositories/livekit-room-session.repository';

function buildRoomName(sessionCode: string, sessionId: string): string {
  const base = sessionCode?.trim() ? sessionCode.trim().toLowerCase() : sessionId;
  return `ai-interview-${base}`;
}

@Injectable()
export class CreateLiveKitRoomUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly roomRepository: LivekitRoomSessionRepository,
    private readonly referenceRepository: LivekitIntegrationReferenceRepository,
    private readonly validation: LivekitIntegrationValidationHelper,
    private readonly livekitProvider: LivekitProvider,
  ) {}

  async execute(
    dto: CreateLiveKitRoomDto,
    actorUserId?: string,
  ): Promise<LivekitRoomSessionEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

    const prepared = await this.dataSource.transaction(async (manager) => {
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

      this.validation.ensureSessionCanCreateRoom(
        session.session_status as AiInterviewSessionStatus,
      );

      const existingRoom = await this.roomRepository.findByAiInterviewSessionId(
        session.id,
        { manager, lockForUpdate: true },
      );

      if (existingRoom) {
        if (existingRoom.room_status !== LivekitRoomStatus.ENDED) {
          return { roomSession: existingRoom, roomName: existingRoom.room_name, metadata: null };
        }

        throw new ConflictException({
          message: 'LiveKit room already ended for this AI interview session',
          code: 'LIVEKIT_ROOM_ALREADY_ENDED',
          meta: { livekit_room_session_id: existingRoom.id },
        });
      }

      const roomName = session.livekit_room_name?.trim()
        ? session.livekit_room_name.trim()
        : buildRoomName(session.session_code, session.id);

      const metadata = {
        ai_interview_session_id: session.id,
        interview_id: session.interview_id,
        application_id: session.application_id,
        candidate_id: session.candidate_id,
        session_code: session.session_code,
        session_status: session.session_status,
      };

      session.livekit_room_name = roomName;
      session.updated_by_user_id = actorUserId;
      await this.referenceRepository.updateAiInterviewSession(session, { manager });

      const roomSession = await this.roomRepository.createRoomSession(
        {
          ai_interview_session_id: session.id,
          interview_id: session.interview_id,
          application_id: session.application_id,
          candidate_id: session.candidate_id,
          room_name: roomName,
          room_status: LivekitRoomStatus.CREATED,
          candidate_identity: null,
          ai_agent_identity: null,
          room_started_at: null,
          room_ended_at: null,
          last_webhook_event_at: null,
          metadata,
          created_by_user_id: actorUserId,
          updated_by_user_id: actorUserId,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      return { roomSession, roomName, metadata };
    });

    if (prepared.metadata) {
      await this.livekitProvider.createRoom({
        roomName: prepared.roomName,
        metadata: prepared.metadata,
        emptyTimeout: 600,
        departureTimeout: 120,
        maxParticipants: 10,
      });
    }

    return prepared.roomSession;
  }
}
