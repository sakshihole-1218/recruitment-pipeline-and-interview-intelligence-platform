import { Injectable } from '@nestjs/common';

import { InterviewFeedbackEntity } from '../../interviews/entities/interview-feedback.entity';

import { FinalAiRecommendation } from '../enums/final-ai-recommendation.enum';

import {
  AiInsightsProvider,
  FeedbackAiSummaryResult,
  ResumeAiAnalysisResult,
} from './ai-insights-provider';

@Injectable()
export class HeuristicAiInsightsProvider implements AiInsightsProvider {
  async analyzeResumeText(extractedText: string): Promise<ResumeAiAnalysisResult> {
    const normalized = extractedText
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

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

    const hasBachelors =
      /\b(bachelor|b\.tech|btech|b\.e|be|b\.sc|bsc)\b/i.test(extractedText);
    const hasMasters =
      /\b(master|m\.tech|mtech|m\.e|me|m\.sc|msc|mba)\b/i.test(extractedText);
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
    const educationScore = hasPhd ? 20 : hasMasters ? 15 : hasBachelors ? 10 : 0;
    const baseScore = 30;

    const aiFitScore = Math.max(
      0,
      Math.min(100, baseScore + skillsScore + yearsScore + educationScore),
    );

    return {
      skills_extracted: {
        skills: matchedSkills,
        total: matchedSkills.length,
      },
      experience_summary: experienceSummary,
      education_summary: educationSummary,
      ai_fit_score: aiFitScore,
    };
  }

  async summarizeInterviewFeedback(options: {
    applicationId: string;
    feedbacks: InterviewFeedbackEntity[];
  }): Promise<FeedbackAiSummaryResult> {
    const feedbacks = options.feedbacks ?? [];

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

    const recommendation = this.toRecommendation({
      avgOverall,
      feedbacks,
    });

    const summaryTextParts: string[] = [];
    summaryTextParts.push(
      `AI feedback summary for application ${options.applicationId}.`,
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

    const max = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
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
