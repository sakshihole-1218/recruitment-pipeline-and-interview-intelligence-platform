import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq, { APIError, toFile } from 'groq-sdk';

import {
  SpeechToTextInput,
  SpeechToTextProvider,
  SpeechToTextProviderError,
  SpeechToTextResult,
} from './speech-to-text-provider';

@Injectable()
export class GrokSpeechToTextProvider implements SpeechToTextProvider {
  private static readonly DEFAULT_MODEL = 'whisper-large-v3-turbo';

  private static readonly DEFAULT_TIMEOUT_MS = 30000;

  constructor(private readonly configService: ConfigService) {}

  async transcribeAudio(input: SpeechToTextInput): Promise<SpeechToTextResult> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new SpeechToTextProviderError(
        'GROQ_API_KEY is required when using Groq STT provider',
        { provider: 'groq', reason: 'missing_api_key' },
      );
    }

    const model = this.configService.get<string>(
      'GROQ_STT_MODEL',
      GrokSpeechToTextProvider.DEFAULT_MODEL,
    );

    const client = new Groq({
      apiKey,
      timeout: GrokSpeechToTextProvider.DEFAULT_TIMEOUT_MS,
      maxRetries: 0,
    });

    try {
      const file = await toFile(
        this.getFileBuffer(input.file),
        input.file.originalname || 'audio-upload.webm',
        {
          type: input.file.mimetype || 'application/octet-stream',
        },
      );

      const { data, response } = await client.audio.transcriptions
        .create({
          file,
          model,
          response_format: 'json',
          temperature: 0,
        })
        .withResponse();

      return {
        transcript: String(data.text ?? '').trim(),
        confidence: null,
        rawResponse: {
          provider: 'groq',
          model,
          response_format: 'json',
          request_id: response.headers.get('x-request-id'),
          original_filename: input.file.originalname,
          mime_type: input.file.mimetype,
          size_bytes: input.file.size,
        },
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw new SpeechToTextProviderError(
          'Groq transcription request failed',
          {
            provider: 'groq',
            status: error.status,
            error_name: error.name,
          },
        );
      }

      throw new SpeechToTextProviderError('Groq transcription request failed', {
        provider: 'groq',
        error_name: (error as Error)?.name ?? 'UnknownError',
      });
    }
  }

  private getFileBuffer(file: Express.Multer.File): Buffer {
    if (file.buffer?.length) {
      return file.buffer;
    }

    throw new SpeechToTextProviderError(
      'Uploaded audio buffer is missing for Groq transcription',
      {
        provider: 'groq',
        reason: 'missing_buffer',
      },
    );
  }
}
