import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { AiInterviewSessionStatus } from '../../aiInterviewSessions/enums/ai-interview-session-status.enum';

import { LivekitRoomStatus } from '../enums/livekit-room-status.enum';
import { LivekitParticipantType } from '../enums/livekit-participant-type.enum';

@Injectable()
export class LivekitIntegrationValidationHelper {
  ensureActorUserRequired(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }
  }

  ensureSessionCanCreateRoom(status: AiInterviewSessionStatus): void {
    const allowed = new Set<AiInterviewSessionStatus>([
      AiInterviewSessionStatus.READY,
      AiInterviewSessionStatus.IN_PROGRESS,
    ]);

    if (!allowed.has(status)) {
      throw new ConflictException({
        message: 'LiveKit room can only be created for READY or IN_PROGRESS AI interview sessions',
        code: 'LIVEKIT_ROOM_SESSION_STATUS_INVALID',
        meta: { session_status: status },
      });
    }
  }

  ensureRoomAvailableForToken(status: LivekitRoomStatus): void {
    if (status === LivekitRoomStatus.ENDED || status === LivekitRoomStatus.FAILED) {
      throw new ConflictException({
        message: 'LiveKit room is not active for token generation',
        code: 'LIVEKIT_ROOM_NOT_AVAILABLE_FOR_TOKEN',
        meta: { room_status: status },
      });
    }
  }

  ensureRoomCanBeEnded(status: LivekitRoomStatus): void {
    if (status === LivekitRoomStatus.FAILED) {
      throw new ConflictException({
        message: 'Failed LiveKit room cannot be ended again',
        code: 'LIVEKIT_ROOM_ALREADY_FAILED',
        meta: { room_status: status },
      });
    }
  }

  ensureReviewerIdentityProvided(
    participantType: LivekitParticipantType,
    identity?: string,
  ): void {
    if (
      (participantType === LivekitParticipantType.REVIEWER ||
        participantType === LivekitParticipantType.ADMIN) &&
      !identity
    ) {
      throw new BadRequestException({
        message: 'Identity is required for reviewer and admin participants',
        code: 'LIVEKIT_IDENTITY_REQUIRED',
        meta: { participant_type: participantType },
      });
    }
  }
}
