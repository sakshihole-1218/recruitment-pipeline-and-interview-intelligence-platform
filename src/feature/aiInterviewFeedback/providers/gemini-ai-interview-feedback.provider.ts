import { Injectable, Logger } from '@nestjs/common';

import { GeminiClient } from '../../../common/ai/gemini/gemini.client';
import { GeminiJsonHelper } from '../../../common/ai/gemini/gemini-json.helper';
import { AiInterviewRecommendation } from '../enums/ai-interview-recommendation.enum';
import { GeminiAiInterviewFeedbackPromptHelper } from '../helpers/gemini-ai-interview-feedback-prompt.helper';

import {
  AiInterviewFeedbackProvider,
  GenerateAiInterviewFeedbackInput,
  GenerateAiInterviewFeedbackOutput,
} from './ai-interview-feedback-provider';

type GeminiInterviewFeedbackResponse = {
  technical_score?: number | string | null;
  communication_score?: number | string | null;
  problem_solving_score?: number | string | null;
  project_understanding_score?: number | string | null;
  answer_relevance_score?: number | string | null;
  confidence_score?: number | string | null;
  overall_score?: number | string | null;
  technical_summary?: string | null;
  communication_summary?: string | null;
  problem_solving_summary?: string | null;
  project_understanding_summary?: string | null;
  strengths?: string | null;
  concerns?: string | null;
  improvement_areas?: string | null;
  ai_recommendation?: string | null;
};

@Injectable()
export class GeminiAiInterviewFeedbackProvider
  implements AiInterviewFeedbackProvider
{
  private readonly logger = new Logger(GeminiAiInterviewFeedbackProvider.name);

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
        GeminiJsonHelper.parseJson<GeminiInterviewFeedbackResponse>(responseText);

      const technicalScore = this.toScore(parsed.technical_score, 'technical_score');
      const communicationScore = this.toScore(
        parsed.communication_score,
        'communication_score',
      );
      const problemSolvingScore = this.toScore(
        parsed.problem_solving_score,
        'problem_solving_score',
      );
      const projectUnderstandingScore = this.toScore(
        parsed.project_understanding_score,
        'project_understanding_score',
      );
      const answerRelevanceScore = this.toScore(
        parsed.answer_relevance_score,
        'answer_relevance_score',
      );
      const confidenceScore = this.toScore(parsed.confidence_score, 'confidence_score');
      const overallScore =
        this.toNullableScore(parsed.overall_score) ??
        this.average([
          technicalScore,
          communicationScore,
          problemSolvingScore,
          projectUnderstandingScore,
          answerRelevanceScore,
          confidenceScore,
        ]);

      return {
        technical_score: technicalScore,
        communication_score: communicationScore,
        problem_solving_score: problemSolvingScore,
        project_understanding_score: projectUnderstandingScore,
        answer_relevance_score: answerRelevanceScore,
        confidence_score: confidenceScore,
        overall_score: overallScore,
        technical_summary: this.toNullableText(parsed.technical_summary),
        communication_summary: this.toNullableText(parsed.communication_summary),
        problem_solving_summary: this.toNullableText(parsed.problem_solving_summary),
        project_understanding_summary: this.toNullableText(
          parsed.project_understanding_summary,
        ),
        strengths: this.toNullableText(parsed.strengths),
        concerns: this.toNullableText(parsed.concerns),
        improvement_areas: this.toNullableText(parsed.improvement_areas),
        ai_recommendation: this.toRecommendation(
          parsed.ai_recommendation,
          overallScore,
        ),
        raw_ai_payload: {
          provider: 'gemini-ai-interview-feedback',
          model: 'gemini-2.5-flash',
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

  private toNullableScore(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      throw new Error('Gemini returned invalid score');
    }

    return Number(numeric.toFixed(2));
  }

  private average(values: number[]): number {
    return Number(
      (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2),
    );
  }

  private toNullableText(value: unknown): string | null {
    const text = String(value || '').trim();
    return text || null;
  }

  private toRecommendation(
    value: string | null | undefined,
    overallScore: number,
  ): AiInterviewRecommendation {
    const normalized = String(value || '').trim().toUpperCase();

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
