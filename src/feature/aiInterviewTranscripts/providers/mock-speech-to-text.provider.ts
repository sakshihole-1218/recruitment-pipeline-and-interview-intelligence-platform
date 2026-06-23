import { Injectable } from '@nestjs/common';

import {
  SpeechToTextInput,
  SpeechToTextProvider,
  SpeechToTextResult,
} from './speech-to-text-provider';

@Injectable()
export class MockSpeechToTextProvider implements SpeechToTextProvider {
  async transcribeAudio(input: SpeechToTextInput): Promise<SpeechToTextResult> {
    return {
      transcript: 'This is a mock transcribed answer for development.',
      confidence: 0.99,
      rawResponse: {
        provider: 'mock-speech-to-text',
        original_filename: input.file.originalname,
        mime_type: input.file.mimetype,
        size_bytes: input.file.size,
        ai_interview_session_id: input.aiInterviewSessionId ?? null,
        ai_interview_question_id: input.aiInterviewQuestionId ?? null,
      },
    };
  }
}
