export interface SpeechToTextInput {
  file: Express.Multer.File;
  aiInterviewSessionId: string;
  aiInterviewQuestionId: string;
}

export interface SpeechToTextResult {
  transcriptText: string;
  confidence?: number | null;
  rawPayload?: Record<string, unknown> | null;
}

export interface SpeechToTextProvider {
  transcribe(input: SpeechToTextInput): Promise<SpeechToTextResult>;
}

export const SPEECH_TO_TEXT_PROVIDER = Symbol('SPEECH_TO_TEXT_PROVIDER');
