import { Injectable } from '@nestjs/common';

import { FinalAiRecommendation } from '../enums/final-ai-recommendation.enum';

import {
  AiInsightsProvider,
  AnalyzeResumeInput,
  AnalyzeResumeOutput,
  GenerateFeedbackSummaryInput,
  GenerateFeedbackSummaryOutput,
} from './ai-insights-provider';

@Injectable()
export class MockAiInsightsProvider implements AiInsightsProvider {
  async analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
    const extractedText =
      String(input.extractedText ?? '').trim() ||
      'Rahul Sharma\nrahul@example.com\n+919876543210\nSkills: Node.js, NestJS, PostgreSQL\nExperience: 2 yrs\nEducation: B.E. Computer Engineering, Mumbai University';

    const parsed = {
      candidate_name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+919876543210',
      skills: ['Node.js', 'NestJS', 'PostgreSQL'],
      experience_years: 2,
      education: [
        {
          degree: 'B.E. Computer Engineering',
          university: 'Mumbai University',
        },
      ],
      projects: [
        {
          name: 'Recruitment Platform',
          technologies: ['NestJS', 'PostgreSQL', 'TypeORM'],
        },
      ],
      certifications: [],
      context: {
        candidate_id: input.candidateId,
        candidate_document_id: input.candidateDocumentId,
        application_id: input.applicationId ?? null,
      },
    };

    return {
      extracted_text: extractedText,
      parsed_resume_json: parsed,
      skills_extracted: {
        skills: parsed.skills,
        total: parsed.skills.length,
      },
      experience_summary: '2 years of backend development experience with Node.js/NestJS.',
      education_summary: 'B.E. Computer Engineering from Mumbai University.',
      project_summary: 'Built a Recruitment Platform using NestJS, TypeORM, and PostgreSQL.',
      certification_summary: null,
      total_experience_years_detected: 2,
      ai_fit_score: 78,
    };
  }

  async generateFeedbackSummary(
    input: GenerateFeedbackSummaryInput,
  ): Promise<GenerateFeedbackSummaryOutput> {
    const feedbackCount = input.feedbacks?.length ?? 0;

    const overall =
      feedbackCount > 0
        ? input.feedbacks
            .map((f) => Number(f.overall_score))
            .filter((n) => Number.isFinite(n))
            .reduce((a, b, _, arr) => a + b / arr.length, 0)
        : null;

    const recommendation =
      overall !== null && overall >= 8
        ? FinalAiRecommendation.SELECT
        : FinalAiRecommendation.HOLD;

    return {
      summary_text: `Mocked AI summary for application ${input.applicationId}. Combined ${feedbackCount} feedback entries.`,
      strengths_summary: 'Strong fundamentals, good communication, consistent delivery.',
      concerns_summary: feedbackCount ? 'Some gaps in system design depth.' : null,
      technical_summary: 'Backend fundamentals are strong; overall technical readiness is good.',
      communication_summary: 'Communication is clear and structured.',
      overall_score: overall,
      technical_score: null,
      communication_score: null,
      problem_solving_score: null,
      culture_fit_score: null,
      final_ai_recommendation: recommendation,
    };
  }
}
