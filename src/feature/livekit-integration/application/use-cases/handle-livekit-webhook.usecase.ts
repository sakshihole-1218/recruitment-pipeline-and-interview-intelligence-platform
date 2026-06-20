import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { LivekitWebhookResponseDto } from '../../dto/livekit-webhook-response.dto';
import { LivekitRoomStatus } from '../../enums/livekit-room-status.enum';
import { LivekitProvider } from '../../providers/livekit.provider';
import { LivekitRoomSessionRepository } from '../../repositories/livekit-room-session.repository';

@Injectable()
export class HandleLiveKitWebhookUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly roomRepository: LivekitRoomSessionRepository,
    private readonly livekitProvider: LivekitProvider,
  ) {}

  async execute(input: {
    rawBody: string;
    authorizationHeader?: string;
  }): Promise<LivekitWebhookResponseDto> {
    const event = await this.livekitProvider.receiveWebhookEvent(
      input.rawBody,
      input.authorizationHeader,
    );

    const eventType = String(event?.event || '');
    const roomName = event?.room?.name ? String(event.room.name) : null;

    if (!roomName) {
      return {
        processed: false,
        event_type: eventType || 'unknown',
        room_name: null,
        room_status: null,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const room = await this.roomRepository.findByRoomName(roomName, {
        manager,
        lockForUpdate: true,
      });

      if (!room) {
        return {
          processed: false,
          event_type: eventType || 'unknown',
          room_name: roomName,
          room_status: null,
        };
      }

      const now = new Date();
      const participantIdentity = event?.participant?.identity
        ? String(event.participant.identity)
        : null;
      const trackSid = event?.track?.sid ? String(event.track.sid) : null;

      room.last_webhook_event_at = now;
      room.metadata = {
        ...(room.metadata || {}),
        last_webhook_event_type: eventType || 'unknown',
        last_webhook_event_at: now.toISOString(),
        last_participant_identity: participantIdentity,
        last_track_sid: trackSid,
      };

      switch (eventType) {
        case 'room_started':
          room.room_status = LivekitRoomStatus.ACTIVE;
          room.room_started_at = room.room_started_at || now;
          break;
        case 'room_finished':
          room.room_status = LivekitRoomStatus.ENDED;
          room.room_ended_at = room.room_ended_at || now;
          break;
        case 'participant_joined':
          if (participantIdentity?.startsWith('candidate-')) {
            room.candidate_identity = participantIdentity;
          }
          if (participantIdentity?.startsWith('ai-agent-')) {
            room.ai_agent_identity = participantIdentity;
          }
          if (room.room_status === LivekitRoomStatus.CREATED) {
            room.room_status = LivekitRoomStatus.ACTIVE;
            room.room_started_at = room.room_started_at || now;
          }
          break;
        case 'participant_left':
        case 'track_published':
        case 'track_unpublished':
          break;
        default:
          break;
      }

      const updated = await this.roomRepository.updateRoomSession(room, {
        manager,
      });

      return {
        processed: true,
        event_type: eventType || 'unknown',
        room_name: updated.room_name,
        room_status: updated.room_status,
      };
    });
  }
}
