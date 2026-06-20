import { Injectable } from '@nestjs/common';

import { InterviewFeedbackEntity } from '../../interviews/entities/interview-feedback.entity';

import { FinalAiRecommendation } from '../enums/final-ai-recommendation.enum';

import {
  AnalyzeResumeInput,
  AnalyzeResumeOutput,
  AiInsightsProvider,
  GenerateFeedbackSummaryInput,
  GenerateFeedbackSummaryOutput,
} from './ai-insights-provider';

@Injectable()
export class HeuristicAiInsightsProvider implements AiInsightsProvider {
  async analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
    const extractedText = String(input.extractedText ?? '').trim();
    const normalized = extractedText.replace(/\s+/g, ' ').trim().toLowerCase();

    const knownSkills = [
      'typescript',
      'javascript',
      'node',
      'node.js',
      'nestjs',
      'express',
      'typeorm',
      'postgresql',
      'postgres',
      'redis',
      'docker',
      'kubernetes',
      'aws',
      'gcp',
      'azure',
      'microservices',
      'rest',
      'graphql',
      'jest',
      'cicd',
      'ci/cd',
      'git',
      'python',
      'java',
      'go',
      'react',
      'angular',
    ];

    const matchedSkills = Array.from(
      new Set(
        knownSkills
          .filter((s) => {
            const token = s.replace('.', '\\.').replace('/', '\\/');
            const re = new RegExp(`(^|\\b)${token}(\\b|$)`, 'i');
            return re.test(extractedText);
          })
          .map((s) => (s === 'node.js' ? 'node' : s))
          .map((s) => s.toUpperCase()),
      ),
    ).sort();

    const yearsMatches = Array.from(
      extractedText.matchAll(/(\d{1,2})\s*\+?\s*(years|yrs)\b/gi),
    );
    const years = yearsMatches
      .map((m) => Number(m?.[1]))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .sort((a, b) => b - a)[0];

    const hasBachelors = /\b(bachelor|b\.tech|btech|b\.e|be|b\.sc|bsc)\b/i.test(
      extractedText,
    );
    const hasMasters = /\b(master|m\.tech|mtech|m\.e|me|m\.sc|msc|mba)\b/i.test(
      extractedText,
    );
    const hasPhd = /\b(phd|doctorate)\b/i.test(extractedText);

    const educationLevels: string[] = [];
    if (hasPhd) educationLevels.push('Doctorate');
    if (hasMasters) educationLevels.push('Masters');
    if (hasBachelors) educationLevels.push('Bachelors');

    const experienceSummary = Number.isFinite(years)
      ? `${years} years of experience mentioned in resume.`
      : normalized.length > 0
        ? 'Experience details captured from resume text.'
        : null;

    const educationSummary = educationLevels.length
      ? `Education mentions: ${educationLevels.join(', ')}.`
      : normalized.length > 0
        ? 'Education details captured from resume text.'
        : null;

    const skillsScore = Math.min(40, matchedSkills.length * 4);
    const yearsScore = Number.isFinite(years) ? Math.min(30, years * 3) : 0;
    const educationScore = hasPhd
      ? 20
      : hasMasters
        ? 15
        : hasBachelors
          ? 10
          : 0;
    const baseScore = 30;

    const aiFitScore = Math.max(
      0,
      Math.min(100, baseScore + skillsScore + yearsScore + educationScore),
    );

    return {
      extracted_text:
        extractedText ||
        `Resume analysis initiated for candidate_document_id=${input.candidateDocumentId}.`,
      parsed_resume_json: {
        candidate_id: input.candidateId,
        application_id: input.applicationId ?? null,
        skills: matchedSkills.map((s) => s.toLowerCase()),
        experience_years: Number.isFinite(years) ? years : null,
      },
      skills_extracted: {
        skills: matchedSkills,
        total: matchedSkills.length,
      },
      experience_summary: experienceSummary,
      education_summary: educationSummary,
      project_summary: normalized.length
        ? 'Projects extracted from resume text.'
        : null,
      certification_summary: normalized.length
        ? 'Certifications extracted from resume text.'
        : null,
      total_experience_years_detected: Number.isFinite(years) ? years : null,
      ai_fit_score: aiFitScore,
    };
  }

  async generateFeedbackSummary(
    input: GenerateFeedbackSummaryInput,
  ): Promise<GenerateFeedbackSummaryOutput> {
    const feedbacks: InterviewFeedbackEntity[] = input.feedbacks ?? [];

    const numericOverallScores = feedbacks
      .map((f) => Number(f.overall_score))
      .filter((n) => Number.isFinite(n));

    const avgOverall = numericOverallScores.length
      ? numericOverallScores.reduce((a, b) => a + b, 0) /
        numericOverallScores.length
      : null;

    const strengths = feedbacks
      .map((f) => (f.strengths ?? '').trim())
      .filter(Boolean);
    const concerns = feedbacks
      .map((f) => (f.concerns ?? '').trim())
      .filter(Boolean);

    const strengthsSummary = strengths.length
      ? Array.from(new Set(strengths)).slice(0, 10).join('\n')
      : null;

    const concernsSummary = concerns.length
      ? Array.from(new Set(concerns)).slice(0, 10).join('\n')
      : null;

    const avgScore = (values: number[]): number | null => {
      if (!values.length) return null;
      const sum = values.reduce((a, b) => a + b, 0);
      return sum / values.length;
    };

    const numeric = {
      technical: feedbacks
        .map((f) => Number(f.technical_score))
        .filter((n) => Number.isFinite(n)),
      communication: feedbacks
        .map((f) => Number(f.communication_score))
        .filter((n) => Number.isFinite(n)),
      problem_solving: feedbacks
        .map((f) => Number(f.problem_solving_score))
        .filter((n) => Number.isFinite(n)),
      culture_fit: feedbacks
        .map((f) => Number(f.culture_fit_score))
        .filter((n) => Number.isFinite(n)),
      overall: numericOverallScores,
    };

    const technicalAvg = avgScore(numeric.technical);
    const communicationAvg = avgScore(numeric.communication);
    const problemSolvingAvg = avgScore(numeric.problem_solving);
    const cultureFitAvg = avgScore(numeric.culture_fit);

    const recommendation = this.toRecommendation({ avgOverall, feedbacks });

    const summaryTextParts: string[] = [];
    summaryTextParts.push(
      `AI feedback summary for application ${input.applicationId}.`,
    );
    summaryTextParts.push(`Total feedback entries: ${feedbacks.length}.`);

    if (avgOverall !== null) {
      summaryTextParts.push(
        `Average overall_score: ${avgOverall.toFixed(2)} (from ${numericOverallScores.length} feedbacks).`,
      );
    }

    summaryTextParts.push(`Final AI recommendation: ${recommendation}.`);

    return {
      summary_text: summaryTextParts.join(' '),
      strengths_summary: strengthsSummary,
      concerns_summary: concernsSummary,
      technical_summary:
        technicalAvg !== null
          ? `Average technical_score: ${technicalAvg.toFixed(2)}.`
          : null,
      communication_summary:
        communicationAvg !== null
          ? `Average communication_score: ${communicationAvg.toFixed(2)}.`
          : null,
      overall_score: avgOverall,
      technical_score: technicalAvg,
      communication_score: communicationAvg,
      problem_solving_score: problemSolvingAvg,
      culture_fit_score: cultureFitAvg,
      final_ai_recommendation: recommendation,
    };
  }

  private toRecommendation(options: {
    avgOverall: number | null;
    feedbacks: InterviewFeedbackEntity[];
  }): FinalAiRecommendation {
    const avg = options.avgOverall;
    if (avg !== null) {
      if (avg >= 8.5) return FinalAiRecommendation.STRONGLY_SELECT;
      if (avg >= 7.0) return FinalAiRecommendation.SELECT;
      if (avg >= 5.5) return FinalAiRecommendation.HOLD;
      if (avg >= 4.0) return FinalAiRecommendation.REJECT;
      return FinalAiRecommendation.STRONGLY_REJECT;
    }

    const counts = new Map<string, number>();
    for (const f of options.feedbacks) {
      const key = String(f.recommendation ?? '').toUpperCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const max = Array.from(counts.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const mapped = (max || '').toUpperCase();

    switch (mapped) {
      case FinalAiRecommendation.STRONGLY_SELECT:
        return FinalAiRecommendation.STRONGLY_SELECT;
      case FinalAiRecommendation.SELECT:
        return FinalAiRecommendation.SELECT;
      case FinalAiRecommendation.HOLD:
        return FinalAiRecommendation.HOLD;
      case FinalAiRecommendation.REJECT:
        return FinalAiRecommendation.REJECT;
      case FinalAiRecommendation.STRONGLY_REJECT:
        return FinalAiRecommendation.STRONGLY_REJECT;
      default:
        return FinalAiRecommendation.HOLD;
    }
  }
}
