import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { TestSpeechToTextUseCase } from './application/use-cases/test-speech-to-text.usecase';
import { TranscribeAnswerUseCase } from './application/use-cases/transcribe-answer.usecase';
import { UpdateTranscriptEntryUseCase } from './application/use-cases/update-transcript-entry.usecase';
import { AiInterviewTranscriptsController } from './controllers/ai-interview-transcripts.controller';
import { SpeechToTextController } from './controllers/speech-to-text.controller';
import { AiInterviewTranscriptEntity } from './entities/ai-interview-transcript.entity';
import { AiInterviewTranscriptsValidationHelper } from './helpers/ai-interview-transcripts-validation.helper';
import { GrokSpeechToTextProvider } from './providers/grok-speech-to-text.provider';
import { AiInterviewTranscriptRepository } from './repositories/ai-interview-transcript.repository';
import { AiInterviewTranscriptsReferenceRepository } from './repositories/ai-interview-transcripts-reference.repository';
import { MockSpeechToTextProvider } from './providers/mock-speech-to-text.provider';
import { SPEECH_TO_TEXT_PROVIDER } from './providers/speech-to-text-provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiInterviewTranscriptEntity,
      AiInterviewSessionEntity,
      AiInterviewQuestionEntity,
    ]),
  ],
  controllers: [AiInterviewTranscriptsController, SpeechToTextController],
  providers: [
    AiInterviewTranscriptsService,
    AiInterviewTranscriptRepository,
    AiInterviewTranscriptsReferenceRepository,
    AiInterviewTranscriptsValidationHelper,
    {
      provide: SPEECH_TO_TEXT_PROVIDER,
      inject: [
        ConfigService,
        MockSpeechToTextProvider,
        GrokSpeechToTextProvider,
      ],
      useFactory: (
        configService: ConfigService,
        mockProvider: MockSpeechToTextProvider,
        grokProvider: GrokSpeechToTextProvider,
      ) => {
        const provider = configService.get<string>('STT_PROVIDER', 'mock');
        if (provider === 'mock') {
          return mockProvider;
        }

        if (provider === 'groq') {
          return grokProvider;
        }

        throw new Error(`Unsupported STT provider: ${provider}`);
      },
    },
    MockSpeechToTextProvider,
    GrokSpeechToTextProvider,
    CreateTranscriptEntryUseCase,
    BulkCreateTranscriptEntriesUseCase,
    GetTranscriptEntryByIdUseCase,
    GetTranscriptBySessionUseCase,
    ListTranscriptEntriesUseCase,
    TestSpeechToTextUseCase,
    TranscribeAnswerUseCase,
    UpdateTranscriptEntryUseCase,
    DeleteTranscriptEntryUseCase,
  ],
  exports: [AiInterviewTranscriptsService],
})
export class AiInterviewTranscriptsModule {}
