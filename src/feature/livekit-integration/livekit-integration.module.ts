import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiInterviewSessionEntity } from '../aiInterviewSessions/entities/ai-interview-session.entity';
import { InterviewEntity } from '../interviews/entities/interview.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { CandidateEntity } from '../candidates/entities/candidate.entity';

import { LivekitIntegrationController } from './controllers/livekit-integration.controller';
import { LivekitIntegrationService } from './application/services/livekit-integration.service';
import { CreateLiveKitRoomUseCase } from './application/use-cases/create-livekit-room.usecase';
import { GenerateLiveKitTokenUseCase } from './application/use-cases/generate-livekit-token.usecase';
import { GetLiveKitRoomBySessionUseCase } from './application/use-cases/get-livekit-room-by-session.usecase';
import { GetLiveKitRoomByIdUseCase } from './application/use-cases/get-livekit-room-by-id.usecase';
import { ListLiveKitRoomsUseCase } from './application/use-cases/list-livekit-rooms.usecase';
import { EndLiveKitRoomUseCase } from './application/use-cases/end-livekit-room.usecase';
import { HandleLiveKitWebhookUseCase } from './application/use-cases/handle-livekit-webhook.usecase';
import { LivekitRoomSessionEntity } from './entities/livekit-room-session.entity';
import { LivekitIntegrationValidationHelper } from './helpers/livekit-integration-validation.helper';
import { LivekitProvider } from './providers/livekit.provider';
import { LivekitIntegrationReferenceRepository } from './repositories/livekit-integration-reference.repository';
import { LivekitRoomSessionRepository } from './repositories/livekit-room-session.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LivekitRoomSessionEntity,
      AiInterviewSessionEntity,
      InterviewEntity,
      ApplicationEntity,
      CandidateEntity,
    ]),
  ],
  controllers: [LivekitIntegrationController],
  providers: [
    LivekitIntegrationService,
    LivekitRoomSessionRepository,
    LivekitIntegrationReferenceRepository,
    LivekitIntegrationValidationHelper,
    LivekitProvider,
    CreateLiveKitRoomUseCase,
    GenerateLiveKitTokenUseCase,
    GetLiveKitRoomBySessionUseCase,
    GetLiveKitRoomByIdUseCase,
    ListLiveKitRoomsUseCase,
    EndLiveKitRoomUseCase,
    HandleLiveKitWebhookUseCase,
  ],
  exports: [LivekitIntegrationService],
})
export class LivekitIntegrationModule {}
