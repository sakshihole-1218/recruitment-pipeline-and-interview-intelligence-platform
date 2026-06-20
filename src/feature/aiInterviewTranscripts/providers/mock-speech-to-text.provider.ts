import { Injectable } from '@nestjs/common';

import {
  SpeechToTextInput,
  SpeechToTextProvider,
  SpeechToTextResult,
} from './speech-to-text-provider';

@Injectable()
export class MockSpeechToTextProvider implements SpeechToTextProvider {
  async transcribe(input: SpeechToTextInput): Promise<SpeechToTextResult> {
    return {
      transcriptText: 'This is a mock transcribed answer for development.',
      confidence: 0.99,
      rawPayload: {
        provider: 'mock-speech-to-text',
        original_filename: input.file.originalname,
        mime_type: input.file.mimetype,
        size_bytes: input.file.size,
        ai_interview_session_id: input.aiInterviewSessionId,
        ai_interview_question_id: input.aiInterviewQuestionId,
      },
    };
  }
}
