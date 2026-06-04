import { InterviewFeedbackEntity } from '../../interviews/entities/interview-feedback.entity';

import { FinalAiRecommendation } from '../enums/final-ai-recommendation.enum';

export const AI_INSIGHTS_PROVIDER = 'AI_INSIGHTS_PROVIDER';

export interface AiInsightsProvider {
  analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput>;

  generateFeedbackSummary(
    input: GenerateFeedbackSummaryInput,
  ): Promise<GenerateFeedbackSummaryOutput>;
}

export type AnalyzeResumeInput = {
  candidateDocumentId: string;
  candidateId: string;
  applicationId?: string | null;
  extractedText?: string | null;
};

export type AnalyzeResumeOutput = {
  extracted_text: string;
  parsed_resume_json: unknown;
  skills_extracted: unknown;
  experience_summary: string | null;
  education_summary: string | null;
  project_summary: string | null;
  certification_summary: string | null;
  total_experience_years_detected: number | null;
  ai_fit_score: number;
};

export type GenerateFeedbackSummaryInput = {
  applicationId: string;
  feedbacks: InterviewFeedbackEntity[];
};

export type GenerateFeedbackSummaryOutput = {
  summary_text: string;
  strengths_summary: string | null;
  concerns_summary: string | null;
  technical_summary: string | null;
  communication_summary: string | null;
  overall_score: number | null;
  technical_score: number | null;
  communication_score: number | null;
  problem_solving_score: number | null;
  culture_fit_score: number | null;
  final_ai_recommendation: FinalAiRecommendation;
};
