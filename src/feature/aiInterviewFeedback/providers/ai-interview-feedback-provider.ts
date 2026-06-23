import { AiInterviewQuestionEntity } from '../../aiInterviewQuestions/entities/ai-interview-question.entity';
import { AiInterviewTranscriptEntity } from '../../aiInterviewTranscripts/entities/ai-interview-transcript.entity';
import { ResumeAiAnalysisEntity } from '../../aiInsights/entities/resume-ai-analysis.entity';
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';

import { AiInterviewRecommendation } from '../enums/ai-interview-recommendation.enum';

export const AI_INTERVIEW_FEEDBACK_PROVIDER = 'AI_INTERVIEW_FEEDBACK_PROVIDER';

export type GenerateAiInterviewFeedbackInput = {
  session: AiInterviewSessionEntity;
  application: {
    id: string;
    application_number: string;
  };
  candidate: {
    id: string;
    full_name: string;
    current_job_title: string | null;
    current_company: string | null;
    resume_headline: string | null;
    total_experience_years: string | null;
  };
  resume_analysis: ResumeAiAnalysisEntity | null;
  questions: AiInterviewQuestionEntity[];
  follow_ups: AiInterviewQuestionEntity[];
  transcripts: AiInterviewTranscriptEntity[];
};

export type GenerateAiInterviewFeedbackOutput = {
  technical_score?: number | null;
  communication_score?: number | null;
  problem_solving_score?: number | null;
  experience_relevance_score?: number | null;
  overall_score?: number | null;
  strengths_summary?: string | null;
  weaknesses_summary?: string | null;
  detailed_feedback?: string | null;
  technical_summary?: string | null;
  communication_summary?: string | null;
  problem_solving_summary?: string | null;
  experience_relevance_summary?: string | null;
  recommendation?: AiInterviewRecommendation | null;
  evaluation_metadata?: Record<string, unknown> | null;
};

export interface InterviewEvaluationProvider {
  generateFeedback(
    input: GenerateAiInterviewFeedbackInput,
  ): Promise<GenerateAiInterviewFeedbackOutput>;
}
