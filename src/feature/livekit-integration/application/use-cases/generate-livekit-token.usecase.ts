import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { type VideoGrant } from 'livekit-server-sdk';

import { AiInterviewSessionStatus } from '../../../aiInterviewSessions/enums/ai-interview-session-status.enum';

import { GenerateLiveKitTokenDto } from '../../dto/generate-livekit-token.dto';
import { LivekitAccessTokenResponseDto } from '../../dto/livekit-access-token.response.dto';
import { LivekitParticipantType } from '../../enums/livekit-participant-type.enum';
import { LivekitIntegrationValidationHelper } from '../../helpers/livekit-integration-validation.helper';
import { LivekitProvider } from '../../providers/livekit.provider';
import { LivekitIntegrationReferenceRepository } from '../../repositories/livekit-integration-reference.repository';
import { LivekitRoomSessionRepository } from '../../repositories/livekit-room-session.repository';

@Injectable()
export class GenerateLiveKitTokenUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly roomRepository: LivekitRoomSessionRepository,
    private readonly referenceRepository: LivekitIntegrationReferenceRepository,
    private readonly validation: LivekitIntegrationValidationHelper,
    private readonly livekitProvider: LivekitProvider,
  ) {}

  async execute(
    dto: GenerateLiveKitTokenDto,
    actorUserId?: string,
  ): Promise<LivekitAccessTokenResponseDto> {
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

      this.validation.ensureSessionCanCreateRoom(session.session_status);

      const roomSession = await this.roomRepository.findByAiInterviewSessionId(
        session.id,
        { manager, lockForUpdate: true },
      );

      if (!roomSession) {
        throw new NotFoundException({
          message: 'LiveKit room session not found for AI interview session',
          code: 'LIVEKIT_ROOM_SESSION_NOT_FOUND',
        });
      }

      this.validation.ensureRoomAvailableForToken(roomSession.room_status);
      this.validation.ensureReviewerIdentityProvided(
        dto.participant_type,
        dto.identity,
      );

      let identity: string;
      let displayName: string;
      let grant: VideoGrant;

      switch (dto.participant_type) {
        case LivekitParticipantType.CANDIDATE:
          identity = `candidate-${session.candidate_id}`;
          displayName = dto.display_name?.trim() || 'Candidate';
          grant = {
            roomJoin: true,
            room: roomSession.room_name,
            canPublish: true,
            canPublishData: true,
            canSubscribe: true,
          };
          roomSession.candidate_identity = identity;
          break;
        case LivekitParticipantType.AI_AGENT:
          identity = `ai-agent-${session.id}`;
          displayName = dto.display_name?.trim() || 'AI Agent';
          grant = {
            roomJoin: true,
            room: roomSession.room_name,
            canPublish: true,
            canPublishData: true,
            canSubscribe: true,
            agent: true,
          };
          roomSession.ai_agent_identity = identity;
          break;
        case LivekitParticipantType.REVIEWER:
          identity = dto.identity!.trim();
          displayName = dto.display_name?.trim() || 'Reviewer';
          grant = {
            roomJoin: true,
            room: roomSession.room_name,
            canPublish: false,
            canPublishData: false,
            canSubscribe: true,
          };
          break;
        case LivekitParticipantType.ADMIN:
        default:
          identity = dto.identity!.trim();
          displayName = dto.display_name?.trim() || 'Admin';
          grant = {
            roomJoin: true,
            room: roomSession.room_name,
            canPublish: false,
            canPublishData: false,
            canSubscribe: true,
            roomAdmin: true,
          };
          break;
      }

      const metadata = {
        ...(roomSession.metadata || {}),
        last_token_participant_type: dto.participant_type,
        last_token_identity: identity,
        last_token_issued_at: new Date().toISOString(),
      };

      roomSession.metadata = metadata;
      roomSession.updated_by_user_id =
        actorUserId ?? roomSession.updated_by_user_id;
      await this.roomRepository.updateRoomSession(roomSession, { manager });

      return {
        roomName: roomSession.room_name,
        sessionId: session.id,
        interviewId: session.interview_id,
        applicationId: session.application_id,
        candidateId: session.candidate_id,
        participantType: dto.participant_type,
        identity,
        displayName,
        grant,
      };
    });

    const token = await this.livekitProvider.generateAccessToken({
      roomName: prepared.roomName,
      identity: prepared.identity,
      name: prepared.displayName,
      metadata: {
        ai_interview_session_id: prepared.sessionId,
        interview_id: prepared.interviewId,
        application_id: prepared.applicationId,
        candidate_id: prepared.candidateId,
        participant_type: prepared.participantType,
      },
      grant: prepared.grant,
    });

    return {
      token,
      room_name: prepared.roomName,
      identity: prepared.identity,
      display_name: prepared.displayName,
      participant_type: prepared.participantType,
      livekit_url: this.livekitProvider.getPublicUrl(),
    };
  }
}
