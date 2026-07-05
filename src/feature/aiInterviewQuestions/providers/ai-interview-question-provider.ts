import { JobOpeningSkillEntity } from '../../job-openings/entities/job-opening-skill.entity';
import { ConversationContext } from '../types/conversation-context.type';

import { DifficultyLevel } from '../enums/difficulty-level.enum';
import { GeneratedFrom } from '../enums/generated-from.enum';
import { QuestionType } from '../enums/question-type.enum';

export const AI_INTERVIEW_QUESTION_PROVIDER = 'AI_INTERVIEW_QUESTION_PROVIDER';

export type GeneratedInterviewPlanQuestion = {
  question_text: string;
  question_type: QuestionType;
  topic: string;
  difficulty_level: DifficultyLevel;
  sequence_number: number;
  generated_from: GeneratedFrom;
  expected_answer_keywords?: string[] | null;
  parent_sequence_number?: number | null;
};

export type GenerateInterviewPlanInput = {
  ai_interview_session_id: string;
  candidate: {
    id: string;
    full_name: string;
    current_job_title: string | null;
    current_company: string | null;
    resume_headline: string | null;
    total_experience_years: string | null;
  };
  application: {
    id: string;
  };
  job_opening: {
    id: string;
    title: string;
    requirements: string | null;
    responsibilities: string | null;
    experience_min_years: number | null;
    experience_max_years: number | null;
  };
  resume_analysis: {
    id: string;
    extracted_text: string | null;
    parsed_resume_json: unknown | null;
    skills_extracted: unknown;
    experience_summary: string | null;
    project_summary: string | null;
    total_experience_years_detected: string | null;
  };
  job_skills: JobOpeningSkillEntity[];
};

export type GenerateFollowUpQuestionInput = {
  sessionId: string;
  currentQuestion: {
    id: string;
    questionText: string;
    topic: string;
    difficultyLevel: DifficultyLevel;
    questionType: QuestionType;
    askedQuestionCount: number;
    previousFollowUpCount: number;
  };
  latestAnswer: string;
  maxFollowUpCount: number;
  conversationContext: ConversationContext;
};

export type GeneratedFollowUpQuestion = {
  followUpQuestion: string;
  difficulty: DifficultyLevel;
  category: string;
  reasoning: string;
};

export interface AiInterviewQuestionProvider {
  generateInterviewPlan(
    input: GenerateInterviewPlanInput,
  ): Promise<GeneratedInterviewPlanQuestion[]>;

  generateFollowUpQuestion(
    input: GenerateFollowUpQuestionInput,
  ): Promise<GeneratedFollowUpQuestion>;
}
