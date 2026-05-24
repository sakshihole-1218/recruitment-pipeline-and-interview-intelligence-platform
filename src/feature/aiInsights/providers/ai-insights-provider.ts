import { InterviewFeedbackEntity } from '../../interviews/entities/interview-feedback.entity';

import { FinalAiRecommendation } from '../enums/final-ai-recommendation.enum';

export const AI_INSIGHTS_PROVIDER = 'AI_INSIGHTS_PROVIDER';

export type ResumeAiAnalysisResult = {
  skills_extracted: unknown;
  experience_summary: string | null;
  education_summary: string | null;
  ai_fit_score: number;
};

export type FeedbackAiSummaryResult = {
  summary_text: string;
  strengths_summary: string | null;
  concerns_summary: string | null;
  final_ai_recommendation: FinalAiRecommendation;
};

export interface AiInsightsProvider {
  analyzeResumeText(extractedText: string): Promise<ResumeAiAnalysisResult>;

  summarizeInterviewFeedback(options: {
    applicationId: string;
    feedbacks: InterviewFeedbackEntity[];
  }): Promise<FeedbackAiSummaryResult>;
}
