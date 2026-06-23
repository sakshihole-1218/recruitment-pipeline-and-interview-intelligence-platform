import { Injectable, Logger } from '@nestjs/common';

import { GeminiClient } from '../../../common/ai/gemini/gemini.client';
import { GeminiJsonHelper } from '../../../common/ai/gemini/gemini-json.helper';
import { AiInterviewRecommendation } from '../enums/ai-interview-recommendation.enum';
import { GeminiAiInterviewFeedbackPromptHelper } from '../helpers/gemini-ai-interview-feedback-prompt.helper';

import {
  GenerateAiInterviewFeedbackInput,
  GenerateAiInterviewFeedbackOutput,
  InterviewEvaluationProvider,
} from './ai-interview-feedback-provider';

type GeminiInterviewFeedbackResponse = {
  technicalScore?: number | string | null;
  communicationScore?: number | string | null;
  problemSolvingScore?: number | string | null;
  experienceRelevanceScore?: number | string | null;
  overallScore?: number | string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  detailedFeedback?: string | null;
  technicalSummary?: string | null;
  communicationSummary?: string | null;
  problemSolvingSummary?: string | null;
  experienceRelevanceSummary?: string | null;
  recommendation?: string | null;
};

@Injectable()
export class GeminiInterviewEvaluationProvider
  implements InterviewEvaluationProvider
{
  private readonly logger = new Logger(GeminiInterviewEvaluationProvider.name);

  constructor(private readonly geminiClient: GeminiClient) {}

  async generateFeedback(
    input: GenerateAiInterviewFeedbackInput,
  ): Promise<GenerateAiInterviewFeedbackOutput> {
    try {
      const responseText = await this.geminiClient.generateText({
        prompt: GeminiAiInterviewFeedbackPromptHelper.buildPrompt(input),
        responseMimeType: 'application/json',
      });

      const parsed =
        GeminiJsonHelper.parseJson<GeminiInterviewFeedbackResponse>(
          responseText,
        );

      const technicalScore = this.toScore(
        parsed.technicalScore,
        'technicalScore',
      );
      const communicationScore = this.toScore(
        parsed.communicationScore,
        'communicationScore',
      );
      const problemSolvingScore = this.toScore(
        parsed.problemSolvingScore,
        'problemSolvingScore',
      );
      const experienceRelevanceScore = this.toScore(
        parsed.experienceRelevanceScore,
        'experienceRelevanceScore',
      );
      const overallScore =
        this.toNullableOverallScore(parsed.overallScore) ??
        this.calculateOverallScore([
          technicalScore,
          communicationScore,
          problemSolvingScore,
          experienceRelevanceScore,
        ]);

      return {
        technical_score: technicalScore,
        communication_score: communicationScore,
        problem_solving_score: problemSolvingScore,
        experience_relevance_score: experienceRelevanceScore,
        overall_score: overallScore,
        strengths_summary: this.toNullableText(parsed.strengths),
        weaknesses_summary: this.toNullableText(parsed.weaknesses),
        detailed_feedback: this.toNullableText(parsed.detailedFeedback),
        technical_summary: this.toNullableText(parsed.technicalSummary),
        communication_summary: this.toNullableText(
          parsed.communicationSummary,
        ),
        problem_solving_summary: this.toNullableText(
          parsed.problemSolvingSummary,
        ),
        experience_relevance_summary: this.toNullableText(
          parsed.experienceRelevanceSummary,
        ),
        recommendation: this.toRecommendation(
          parsed.recommendation,
          overallScore,
        ),
        evaluation_metadata: {
          provider: 'gemini-ai-interview-feedback',
          model: 'gemini-2.5-flash',
          category_score_scale: '0-10',
          overall_score_scale: '0-100',
        },
      };
    } catch (error) {
      this.logger.warn('Gemini interview feedback generation failed');
      throw error;
    }
  }

  private toScore(
    value: number | string | null | undefined,
    fieldName: string,
  ): number {
    const numeric = this.toNullableScore(value);

    if (numeric === null) {
      throw new Error(`Gemini returned missing ${fieldName}`);
    }

    return numeric;
  }

  private toNullableScore(
    value: number | string | null | undefined,
  ): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 10) {
      throw new Error('Gemini returned invalid score');
    }

    return Number(numeric.toFixed(2));
  }

  private toNullableOverallScore(
    value: number | string | null | undefined,
  ): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      throw new Error('Gemini returned invalid overall score');
    }

    return Number(numeric.toFixed(2));
  }

  private calculateOverallScore(values: number[]): number {
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Number((average * 10).toFixed(2));
  }

  private toNullableText(value: unknown): string | null {
    const text = String(value || '').trim();
    return text || null;
  }

  private toRecommendation(
    value: string | null | undefined,
    overallScore: number,
  ): AiInterviewRecommendation {
    const normalized = String(value || '')
      .trim()
      .toUpperCase();

    if (
      Object.values(AiInterviewRecommendation).includes(
        normalized as AiInterviewRecommendation,
      )
    ) {
      return normalized as AiInterviewRecommendation;
    }

    if (overallScore <= 39) return AiInterviewRecommendation.STRONGLY_REJECT;
    if (overallScore <= 54) return AiInterviewRecommendation.REJECT;
    if (overallScore <= 69) return AiInterviewRecommendation.HOLD;
    if (overallScore <= 84) return AiInterviewRecommendation.SELECT;
    return AiInterviewRecommendation.STRONGLY_SELECT;
  }
}
