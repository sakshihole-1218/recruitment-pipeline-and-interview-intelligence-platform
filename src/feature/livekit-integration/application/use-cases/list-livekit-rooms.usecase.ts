import { Injectable } from '@nestjs/common';

import { LiveKitRoomQueryDto } from '../../dto/livekit-room-query.dto';
import { LivekitRoomSessionRepository } from '../../repositories/livekit-room-session.repository';

@Injectable()
export class ListLiveKitRoomsUseCase {
  constructor(private readonly repository: LivekitRoomSessionRepository) {}

  execute(query: LiveKitRoomQueryDto) {
    return this.repository.findAllWithFilters(query);
  }
}
