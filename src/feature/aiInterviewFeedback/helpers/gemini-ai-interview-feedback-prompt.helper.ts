import { GenerateAiInterviewFeedbackInput } from '../providers/ai-interview-feedback-provider';

export class GeminiAiInterviewFeedbackPromptHelper {
  static buildPrompt(input: GenerateAiInterviewFeedbackInput): string {
    const questionTextById = new Map(
      input.questions.map((question) => [question.id, question.question_text]),
    );

    return [
      'You are evaluating a completed AI interview for a recruitment platform.',
      'Evaluate objectively and return JSON only.',
      'Do not include markdown fences or explanations.',
      'Use this exact shape:',
      JSON.stringify(
        {
          technicalScore: 0,
          communicationScore: 0,
          problemSolvingScore: 0,
          experienceRelevanceScore: 0,
          overallScore: 0,
          strengths: '',
          weaknesses: '',
          detailedFeedback: '',
          technicalSummary: '',
          communicationSummary: '',
          problemSolvingSummary: '',
          experienceRelevanceSummary: '',
          recommendation: 'HOLD',
        },
        null,
        2,
      ),
      'Allowed recommendation values:',
      'STRONGLY_REJECT, REJECT, HOLD, SELECT, STRONGLY_SELECT',
      'Scoring rules:',
      '- technicalScore, communicationScore, problemSolvingScore, experienceRelevanceScore must each be between 0 and 10.',
      '- overallScore must be between 0 and 100 and should represent the average of the 4 category scores multiplied by 10.',
      'Evaluation rules:',
      '- Use only the information present in the resume analysis, questions, follow-ups, and transcript.',
      '- Do not hallucinate technologies, systems, or achievements not discussed.',
      '- Consider follow-up answers when judging depth, consistency, and ownership.',
      '- Consider communication quality, technical depth, reasoning, and resume-role alignment.',
      '- Keep strengths and weaknesses concise but meaningful.',
      '- Keep detailedFeedback concise, specific, and decision-useful.',
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
          questions: input.questions
            .filter((question) => !question.is_follow_up)
            .map((question) => ({
              id: question.id,
              sequence_number: question.sequence_number,
              question_text: question.question_text,
              question_type: question.question_type,
              topic: question.topic,
              difficulty_level: question.difficulty_level,
              expected_answer_keywords: question.expected_answer_keywords,
            })),
          follow_ups: input.follow_ups.map((question) => ({
            id: question.id,
            parent_question_id: question.parent_question_id,
            sequence_number: question.sequence_number,
            question_text: question.question_text,
            question_type: question.question_type,
            topic: question.topic,
            difficulty_level: question.difficulty_level,
            follow_up_reasoning: question.follow_up_reasoning,
            expected_answer_keywords: question.expected_answer_keywords,
          })),
          transcript: input.transcripts.map((entry) => ({
            speaker_type: entry.speaker_type,
            question_id: entry.ai_interview_question_id,
            question_text: entry.ai_interview_question_id
              ? questionTextById.get(entry.ai_interview_question_id) ?? null
              : null,
            message_text: entry.message_text,
            spoken_at: entry.spoken_at?.toISOString() ?? null,
            speech_to_text_confidence: entry.speech_to_text_confidence ?? null,
          })),
        },
        null,
        2,
      ),
    ].join('\n');
  }
}
