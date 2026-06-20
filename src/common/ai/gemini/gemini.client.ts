import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

type GeminiGenerateTextOptions = {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: 'application/json' | 'text/plain';
  model?: string;
  timeoutMs?: number;
};

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly defaultModel = 'gemini-2.5-flash';
  private readonly defaultTimeoutMs = 20000;

  constructor(private readonly configService: ConfigService) {}

  async generateText(options: GeminiGenerateTextOptions): Promise<string> {
    const client = this.createClient();

    try {
      const response = await this.withTimeout(
        client.models.generateContent({
          model: options.model || this.defaultModel,
          contents: options.prompt,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: options.responseMimeType,
          },
        }),
        options.timeoutMs ?? this.defaultTimeoutMs,
      );

      const text = String(response.text ?? '').trim();

      if (!text) {
        throw new Error('Gemini returned an empty response');
      }

      return text;
    } catch (error) {
      this.logger.error(
        `Gemini request failed: ${
          error instanceof Error ? error.message : 'Unknown Gemini error'
        }`,
      );
      throw error;
    }
  }

  private createClient(): GoogleGenAI {
    const apiKey = String(
      this.configService.get<string>('GEMINI_API_KEY') || '',
    ).trim();

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is required when using Gemini AI provider',
      );
    }

    return new GoogleGenAI({ apiKey });
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(`Gemini request timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
