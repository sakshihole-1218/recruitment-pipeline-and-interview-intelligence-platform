import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationEntity } from '../applications/entities/application.entity';
import { CandidateEntity } from '../candidates/entities/candidate.entity';
import { AiInterviewSessionEntity } from '../aiInterviewSessions/entities/ai-interview-session.entity';

import { InterviewProctoringEventsService } from './application/services/interview-proctoring-events.service';
import { BulkCreateProctoringEventsUseCase } from './application/use-cases/bulk-create-proctoring-events.usecase';
import { CreateProctoringEventUseCase } from './application/use-cases/create-proctoring-event.usecase';
import { DeleteProctoringEventUseCase } from './application/use-cases/delete-proctoring-event.usecase';
import { GetProctoringEventByIdUseCase } from './application/use-cases/get-proctoring-event-by-id.usecase';
import { GetProctoringEventsBySessionUseCase } from './application/use-cases/get-proctoring-events-by-session.usecase';
import { GetProctoringRiskSummaryUseCase } from './application/use-cases/get-proctoring-risk-summary.usecase';
import { ListProctoringEventsUseCase } from './application/use-cases/list-proctoring-events.usecase';
import { ResolveProctoringEventUseCase } from './application/use-cases/resolve-proctoring-event.usecase';
import { InterviewProctoringEventsController } from './controllers/interview-proctoring-events.controller';
import { InterviewProctoringEventEntity } from './entities/interview-proctoring-event.entity';
import { InterviewProctoringEventsValidationHelper } from './helpers/interview-proctoring-events-validation.helper';
import { InterviewProctoringEventsReferenceRepository } from './repositories/interview-proctoring-events-reference.repository';
import { InterviewProctoringEventsRepository } from './repositories/interview-proctoring-events.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InterviewProctoringEventEntity,
      AiInterviewSessionEntity,
      ApplicationEntity,
      CandidateEntity,
    ]),
  ],
  controllers: [InterviewProctoringEventsController],
  providers: [
    InterviewProctoringEventsService,
    InterviewProctoringEventsRepository,
    InterviewProctoringEventsReferenceRepository,
    InterviewProctoringEventsValidationHelper,
    CreateProctoringEventUseCase,
    BulkCreateProctoringEventsUseCase,
    GetProctoringEventByIdUseCase,
    GetProctoringEventsBySessionUseCase,
    ListProctoringEventsUseCase,
    ResolveProctoringEventUseCase,
    GetProctoringRiskSummaryUseCase,
    DeleteProctoringEventUseCase,
  ],
  exports: [InterviewProctoringEventsService],
})
export class AiInterviewProctoringEventsModule {}
