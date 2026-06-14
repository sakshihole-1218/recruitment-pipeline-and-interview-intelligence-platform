import { TranscriptSpeakerType } from '../../aiInterviewTranscripts/enums/transcript-speaker-type.enum';
import { GenerateAiInterviewFeedbackInput } from '../providers/ai-interview-feedback-provider';

export class GeminiAiInterviewFeedbackPromptHelper {
  static buildPrompt(input: GenerateAiInterviewFeedbackInput): string {
    return [
      'Evaluate this AI interview transcript and return JSON only.',
      'Do not include markdown fences or explanations.',
      'Use this exact shape:',
      JSON.stringify(
        {
          technical_score: 0,
          communication_score: 0,
          problem_solving_score: 0,
          project_understanding_score: 0,
          answer_relevance_score: 0,
          confidence_score: 0,
          overall_score: 0,
          technical_summary: '',
          communication_summary: '',
          problem_solving_summary: '',
          project_understanding_summary: '',
          strengths: '',
          concerns: '',
          improvement_areas: '',
          ai_recommendation: 'HOLD',
        },
        null,
        2,
      ),
      'Allowed ai_recommendation values:',
      'STRONGLY_REJECT, REJECT, HOLD, SELECT, STRONGLY_SELECT',
      'All scores must be between 0 and 100.',
      'Context:',
      JSON.stringify(
        {
          session: {
            id: input.session.id,
            session_status: input.session.session_status,
            interview_id: input.session.interview_id,
          },
          application: input.application,
          candidate: input.candidate,
          resume_analysis: input.resume_analysis
            ? {
                id: input.resume_analysis.id,
                parsed_resume_json: input.resume_analysis.parsed_resume_json,
                skills_extracted: input.resume_analysis.skills_extracted,
                experience_summary: input.resume_analysis.experience_summary,
                project_summary: input.resume_analysis.project_summary,
              }
            : null,
          questions: input.questions.map((question) => ({
            sequence_number: question.sequence_number,
            question_text: question.question_text,
            question_type: question.question_type,
            topic: question.topic,
            difficulty_level: question.difficulty_level,
          })),
          transcript: input.transcripts.map((entry) => ({
            speaker_type: entry.speaker_type,
            question_id: entry.ai_interview_question_id,
            question_text:
              entry.ai_interview_question?.question_text ||
              (entry.speaker_type === TranscriptSpeakerType.AI_INTERVIEWER
                ? entry.message_text
                : null),
            message_text: entry.message_text,
          })),
        },
        null,
        2,
      ),
    ].join('\n');
  }
}
