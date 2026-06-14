import { Injectable, NotFoundException } from '@nestjs/common';

import { LivekitRoomSessionEntity } from '../../entities/livekit-room-session.entity';
import { LivekitRoomSessionRepository } from '../../repositories/livekit-room-session.repository';

@Injectable()
export class GetLiveKitRoomByIdUseCase {
  constructor(private readonly repository: LivekitRoomSessionRepository) {}

  async execute(id: string): Promise<LivekitRoomSessionEntity> {
    const room = await this.repository.findById(id);

    if (!room) {
      throw new NotFoundException({
        message: 'LiveKit room session not found',
        code: 'LIVEKIT_ROOM_SESSION_NOT_FOUND',
      });
    }

    return room;
  }
}
