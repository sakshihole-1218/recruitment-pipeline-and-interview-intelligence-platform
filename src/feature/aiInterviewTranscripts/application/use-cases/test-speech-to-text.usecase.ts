import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  SPEECH_TO_TEXT_PROVIDER,
  SpeechToTextProvider,
  SpeechToTextProviderError,
} from '../../providers/speech-to-text-provider';
import { AiInterviewTranscriptsValidationHelper } from '../../helpers/ai-interview-transcripts-validation.helper';

@Injectable()
export class TestSpeechToTextUseCase {
  private readonly logger = new Logger(TestSpeechToTextUseCase.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly validation: AiInterviewTranscriptsValidationHelper,
    @Inject(SPEECH_TO_TEXT_PROVIDER)
    private readonly speechToTextProvider: SpeechToTextProvider,
  ) {}

  async execute(file: Express.Multer.File | undefined): Promise<{
    transcript: string;
    provider: string;
    model: string | null;
  }> {
    this.validation.ensureAudioFileProvided(file);
    this.validation.ensureAudioFileType(file);
    this.validation.ensureAudioFileSize(file, this.getMaxAudioUploadBytes());

    try {
      const result = await this.speechToTextProvider.transcribeAudio({
        file,
      });

      const provider = this.configService.get<string>('STT_PROVIDER', 'mock');

      return {
        transcript: String(result.transcript ?? '').trim(),
        provider,
        model:
          provider === 'groq'
            ? this.configService.get<string>(
                'GROQ_STT_MODEL',
                'whisper-large-v3-turbo',
              )
            : null,
      };
    } catch (error) {
      if (error instanceof SpeechToTextProviderError) {
        const status =
          typeof error.meta?.status === 'number' ? error.meta.status : 'n/a';
        this.logger.error(
          `Speech-to-text test request failed. status=${status}; reason=${error.message}`,
        );

        throw new BadGatewayException({
          message: 'Speech transcription failed. Please try again.',
          code: 'STT_TEST_FAILED',
        });
      }

      throw error;
    }
  }

  private getMaxAudioUploadBytes(): number {
    const fallback = 20 * 1024 * 1024;
    const raw = Number(process.env.AI_INTERVIEW_AUDIO_MAX_BYTES);
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }
}
