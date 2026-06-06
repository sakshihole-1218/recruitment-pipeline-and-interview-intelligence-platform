import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiInterviewQuestionEntity } from '../aiInterviewQuestions/entities/ai-interview-question.entity';
import { AiInterviewSessionEntity } from '../aiInterviewSessions/entities/ai-interview-session.entity';

import { AiInterviewTranscriptsService } from './application/services/ai-interview-transcripts.service';
import { BulkCreateTranscriptEntriesUseCase } from './application/use-cases/bulk-create-transcript-entries.usecase';
import { CreateTranscriptEntryUseCase } from './application/use-cases/create-transcript-entry.usecase';
import { DeleteTranscriptEntryUseCase } from './application/use-cases/delete-transcript-entry.usecase';
import { GetTranscriptEntryByIdUseCase } from './application/use-cases/get-transcript-entry-by-id.usecase';
import { GetTranscriptBySessionUseCase } from './application/use-cases/get-transcript-by-session.usecase';
import { ListTranscriptEntriesUseCase } from './application/use-cases/list-transcript-entries.usecase';
import { UpdateTranscriptEntryUseCase } from './application/use-cases/update-transcript-entry.usecase';
import { AiInterviewTranscriptsController } from './controllers/ai-interview-transcripts.controller';
import { AiInterviewTranscriptEntity } from './entities/ai-interview-transcript.entity';
import { AiInterviewTranscriptsValidationHelper } from './helpers/ai-interview-transcripts-validation.helper';
import { AiInterviewTranscriptRepository } from './repositories/ai-interview-transcript.repository';
import { AiInterviewTranscriptsReferenceRepository } from './repositories/ai-interview-transcripts-reference.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiInterviewTranscriptEntity,
      AiInterviewSessionEntity,
      AiInterviewQuestionEntity,
    ]),
  ],
  controllers: [AiInterviewTranscriptsController],
  providers: [
    AiInterviewTranscriptsService,
    AiInterviewTranscriptRepository,
    AiInterviewTranscriptsReferenceRepository,
    AiInterviewTranscriptsValidationHelper,
    CreateTranscriptEntryUseCase,
    BulkCreateTranscriptEntriesUseCase,
    GetTranscriptEntryByIdUseCase,
    GetTranscriptBySessionUseCase,
    ListTranscriptEntriesUseCase,
    UpdateTranscriptEntryUseCase,
    DeleteTranscriptEntryUseCase,
  ],
  exports: [AiInterviewTranscriptsService],
})
export class AiInterviewTranscriptsModule {}
