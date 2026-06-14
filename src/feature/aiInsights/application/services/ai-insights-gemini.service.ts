import { Injectable } from '@nestjs/common';

import { TestGeminiConnectionUseCase } from '../use-cases/test-gemini-connection.usecase';

@Injectable()
export class AiInsightsGeminiService {
  constructor(
    private readonly testGeminiConnectionUseCase: TestGeminiConnectionUseCase,
  ) {}

  testConnection(): Promise<{ provider: string; response_text: string }> {
    return this.testGeminiConnectionUseCase.execute();
  }
}
