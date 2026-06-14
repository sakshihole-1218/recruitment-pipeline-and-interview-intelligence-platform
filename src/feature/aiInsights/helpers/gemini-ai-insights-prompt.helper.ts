import { InterviewFeedbackEntity } from '../../interviews/entities/interview-feedback.entity';

import { GenerateFeedbackSummaryInput } from '../providers/ai-insights-provider';

export class GeminiAiInsightsPromptHelper {
  static buildResumeAnalysisPrompt(extractedText: string): string {
    return [
      'Analyze the following candidate resume and return JSON only.',
      'Do not include markdown fences, explanations, or extra commentary.',
      'Use this exact shape:',
      JSON.stringify(
        {
          candidate_name: '',
          email: '',
          phone: '',
          skills: [],
          experience_years: 0,
          education: [],
          projects: [],
          certifications: [],
          experience_summary: '',
          education_summary: '',
          project_summary: '',
          certification_summary: '',
          ai_fit_score: 0,
        },
        null,
        2,
      ),
      'Rules:',
      '- ai_fit_score must be between 0 and 100.',
      '- skills must be a de-duplicated string array.',
      '- experience_years must be numeric.',
      '- education, projects, and certifications must be arrays.',
      '- Summaries must be concise and professional.',
      'Resume text:',
      extractedText,
    ].join('\n');
  }

  static buildFeedbackSummaryPrompt(
    input: GenerateFeedbackSummaryInput,
    feedbacks: InterviewFeedbackEntity[],
  ): string {
    return [
      'You are summarizing human interview feedback for a recruitment platform.',
      'Return JSON only with this exact shape:',
      JSON.stringify(
        {
          summary_text: '',
          strengths_summary: '',
          concerns_summary: '',
          technical_summary: '',
          communication_summary: '',
          overall_score: 0,
          technical_score: 0,
          communication_score: 0,
          problem_solving_score: 0,
          culture_fit_score: 0,
          final_ai_recommendation: 'HOLD',
        },
        null,
        2,
      ),
      'Allowed final_ai_recommendation values:',
      'STRONGLY_REJECT, REJECT, HOLD, SELECT, STRONGLY_SELECT',
      'All scores must be between 0 and 10 because the existing interview feedback records use 10-point scoring.',
      `Application ID: ${input.applicationId}`,
      'Feedback records:',
      JSON.stringify(
        feedbacks.map((feedback) => this.toFeedbackPayload(feedback)),
        null,
        2,
      ),
    ].join('\n');
  }

  private static toFeedbackPayload(feedback: InterviewFeedbackEntity) {
    return {
      id: feedback.id,
      recommendation: feedback.recommendation,
      overall_score: feedback.overall_score,
      technical_score: feedback.technical_score,
      communication_score: feedback.communication_score,
      problem_solving_score: feedback.problem_solving_score,
      culture_fit_score: feedback.culture_fit_score,
      strengths: feedback.strengths,
      concerns: feedback.concerns,
      detailed_feedback: feedback.detailed_feedback,
    };
  }
}
