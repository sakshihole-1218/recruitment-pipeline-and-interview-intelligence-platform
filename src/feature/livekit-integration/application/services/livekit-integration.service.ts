import { Injectable } from '@nestjs/common';

import { CreateLiveKitRoomDto } from '../../dto/create-livekit-room.dto';
import { EndLiveKitRoomDto } from '../../dto/end-livekit-room.dto';
import { GenerateLiveKitTokenDto } from '../../dto/generate-livekit-token.dto';
import { LiveKitRoomQueryDto } from '../../dto/livekit-room-query.dto';

import { CreateLiveKitRoomUseCase } from '../use-cases/create-livekit-room.usecase';
import { GenerateLiveKitTokenUseCase } from '../use-cases/generate-livekit-token.usecase';
import { GetLiveKitRoomBySessionUseCase } from '../use-cases/get-livekit-room-by-session.usecase';
import { GetLiveKitRoomByIdUseCase } from '../use-cases/get-livekit-room-by-id.usecase';
import { ListLiveKitRoomsUseCase } from '../use-cases/list-livekit-rooms.usecase';
import { EndLiveKitRoomUseCase } from '../use-cases/end-livekit-room.usecase';
import { HandleLiveKitWebhookUseCase } from '../use-cases/handle-livekit-webhook.usecase';

@Injectable()
export class LivekitIntegrationService {
  constructor(
    private readonly createRoomUseCase: CreateLiveKitRoomUseCase,
    private readonly generateTokenUseCase: GenerateLiveKitTokenUseCase,
    private readonly getBySessionUseCase: GetLiveKitRoomBySessionUseCase,
    private readonly getByIdUseCase: GetLiveKitRoomByIdUseCase,
    private readonly listUseCase: ListLiveKitRoomsUseCase,
    private readonly endRoomUseCase: EndLiveKitRoomUseCase,
    private readonly handleWebhookUseCase: HandleLiveKitWebhookUseCase,
  ) {}

  createRoom(dto: CreateLiveKitRoomDto, actorUserId?: string) {
    return this.createRoomUseCase.execute(dto, actorUserId);
  }

  generateToken(dto: GenerateLiveKitTokenDto, actorUserId?: string) {
    return this.generateTokenUseCase.execute(dto, actorUserId);
  }

  getBySession(aiInterviewSessionId: string) {
    return this.getBySessionUseCase.execute(aiInterviewSessionId);
  }

  getById(id: string) {
    return this.getByIdUseCase.execute(id);
  }

  list(query: LiveKitRoomQueryDto) {
    return this.listUseCase.execute(query);
  }

  endRoom(dto: EndLiveKitRoomDto, actorUserId?: string) {
    return this.endRoomUseCase.execute(dto, actorUserId);
  }

  handleWebhook(input: { rawBody: string; authorizationHeader?: string }) {
    return this.handleWebhookUseCase.execute(input);
  }
}
