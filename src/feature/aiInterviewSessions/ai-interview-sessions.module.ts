import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InterviewEntity } from '../interviews/entities/interview.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { CandidateEntity } from '../candidates/entities/candidate.entity';
import { ResumeAiAnalysisEntity } from '../aiInsights/entities/resume-ai-analysis.entity';

import { AiInterviewSessionsController } from './controllers/ai-interview-sessions.controller';
import { AiInterviewSessionsService } from './application/services/ai-interview-sessions.service';
import { AiInterviewSessionEntity } from './entities/ai-interview-session.entity';

import { AiInterviewSessionRepository } from './repositories/ai-interview-session.repository';
import { AiInterviewSessionsReferenceRepository } from './repositories/ai-interview-sessions-reference.repository';

import { AiInterviewSessionsValidationHelper } from './helpers/ai-interview-sessions-validation.helper';

import { CreateAiInterviewSessionUseCase } from './application/use-cases/create-ai-interview-session.usecase';
import { StartAiInterviewSessionUseCase } from './application/use-cases/start-ai-interview-session.usecase';
import { EndAiInterviewSessionUseCase } from './application/use-cases/end-ai-interview-session.usecase';
import { CancelAiInterviewSessionUseCase } from './application/use-cases/cancel-ai-interview-session.usecase';
import { MarkAiInterviewSessionFailedUseCase } from './application/use-cases/mark-ai-interview-session-failed.usecase';
import { GetAiInterviewSessionByIdUseCase } from './application/use-cases/get-ai-interview-session-by-id.usecase';
import { GetAiInterviewSessionByInterviewIdUseCase } from './application/use-cases/get-ai-interview-session-by-interview-id.usecase';
import { ListAiInterviewSessionsUseCase } from './application/use-cases/list-ai-interview-sessions.usecase';
import { UpdateAiInterviewSessionUseCase } from './application/use-cases/update-ai-interview-session.usecase';
import { DeleteAiInterviewSessionUseCase } from './application/use-cases/delete-ai-interview-session.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiInterviewSessionEntity,
      InterviewEntity,
      ApplicationEntity,
      CandidateEntity,
      ResumeAiAnalysisEntity,
    ]),
  ],
  controllers: [AiInterviewSessionsController],
  providers: [
    AiInterviewSessionsService,

    AiInterviewSessionRepository,
    AiInterviewSessionsReferenceRepository,

    AiInterviewSessionsValidationHelper,

    CreateAiInterviewSessionUseCase,
    StartAiInterviewSessionUseCase,
    EndAiInterviewSessionUseCase,
    CancelAiInterviewSessionUseCase,
    MarkAiInterviewSessionFailedUseCase,
    GetAiInterviewSessionByIdUseCase,
    GetAiInterviewSessionByInterviewIdUseCase,
    ListAiInterviewSessionsUseCase,
    UpdateAiInterviewSessionUseCase,
    DeleteAiInterviewSessionUseCase,
  ],
  exports: [AiInterviewSessionsService],
})
export class AiInterviewSessionsModule {}
