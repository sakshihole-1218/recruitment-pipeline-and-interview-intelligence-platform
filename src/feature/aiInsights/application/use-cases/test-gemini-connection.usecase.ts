import { Injectable } from '@nestjs/common';

import { GeminiClient } from '../../../../common/ai/gemini/gemini.client';

@Injectable()
export class TestGeminiConnectionUseCase {
  constructor(private readonly geminiClient: GeminiClient) {}

  async execute(): Promise<{ provider: string; response_text: string }> {
    const responseText = await this.geminiClient.generateText({
      prompt: 'Say hello from Gemini',
      responseMimeType: 'text/plain',
    });

    return {
      provider: 'gemini',
      response_text: responseText,
    };
  }
}
