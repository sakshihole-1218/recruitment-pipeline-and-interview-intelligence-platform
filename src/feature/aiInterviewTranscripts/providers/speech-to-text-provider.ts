export interface SpeechToTextInput {
  file: Express.Multer.File;
  aiInterviewSessionId?: string;
  aiInterviewQuestionId?: string;
}

export interface SpeechToTextResult {
  transcript: string;
  confidence?: number | null;
  rawResponse?: Record<string, unknown> | null;
}

export interface SpeechToTextProvider {
  transcribeAudio(input: SpeechToTextInput): Promise<SpeechToTextResult>;
}

export const SPEECH_TO_TEXT_PROVIDER = Symbol('SPEECH_TO_TEXT_PROVIDER');

export class SpeechToTextProviderError extends Error {
  constructor(
    message: string,
    readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'SpeechToTextProviderError';
  }
}
