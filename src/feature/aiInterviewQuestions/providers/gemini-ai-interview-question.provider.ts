import { Injectable, Logger } from '@nestjs/common';

import { GeminiClient } from '../../../common/ai/gemini/gemini.client';
import { GeminiJsonHelper } from '../../../common/ai/gemini/gemini-json.helper';
import { DifficultyLevel } from '../enums/difficulty-level.enum';
import { GeneratedFrom } from '../enums/generated-from.enum';
import { QuestionType } from '../enums/question-type.enum';
import { GeminiAiInterviewQuestionPromptHelper } from '../helpers/gemini-ai-interview-question-prompt.helper';

import {
  AiInterviewQuestionProvider,
  GenerateInterviewPlanInput,
  GeneratedInterviewPlanQuestion,
} from './ai-interview-question-provider';

type GeminiInterviewQuestionResponse = Partial<GeneratedInterviewPlanQuestion>;

@Injectable()
export class GeminiAiInterviewQuestionProvider implements AiInterviewQuestionProvider {
  private readonly logger = new Logger(GeminiAiInterviewQuestionProvider.name);

  constructor(private readonly geminiClient: GeminiClient) {}

  async generateInterviewPlan(
    input: GenerateInterviewPlanInput,
  ): Promise<GeneratedInterviewPlanQuestion[]> {
    try {
      const responseText = await this.geminiClient.generateText({
        prompt: GeminiAiInterviewQuestionPromptHelper.buildPrompt(input),
        responseMimeType: 'application/json',
      });

      const parsed =
        GeminiJsonHelper.parseJson<GeminiInterviewQuestionResponse[]>(responseText);

      if (!Array.isArray(parsed)) {
        throw new Error('Gemini returned invalid interview questions payload');
      }

      const normalized = parsed
        .map((question, index) => this.normalizeQuestion(question, index))
        .filter((question, index, list) => {
          return (
            list.findIndex(
              (item) =>
                item.question_text.toLowerCase() === question.question_text.toLowerCase(),
            ) === index
          );
        })
        .slice(0, 10);

      if (normalized.length < 8) {
        throw new Error('Gemini returned too few interview questions');
      }

      if (!normalized.some((question) => question.question_type === QuestionType.BEHAVIORAL)) {
        throw new Error('Gemini did not include a behavioral interview question');
      }

      return normalized.map((question, index) => ({
        ...question,
        sequence_number: index + 1,
        parent_sequence_number: null,
      }));
    } catch (error) {
      this.logger.warn('Gemini interview plan generation failed');
      throw error;
    }
  }

  private normalizeQuestion(
    question: GeminiInterviewQuestionResponse,
    index: number,
  ): GeneratedInterviewPlanQuestion {
    const questionText = String(question.question_text || '').trim();
    if (!questionText) {
      throw new Error('Gemini returned a question without question_text');
    }

    return {
      question_text: questionText,
      question_type: this.toQuestionType(question.question_type),
      topic: String(question.topic || 'General').trim() || 'General',
      difficulty_level: this.toDifficultyLevel(question.difficulty_level),
      sequence_number: Number(question.sequence_number) || index + 1,
      generated_from: this.toGeneratedFrom(question.generated_from),
      expected_answer_keywords: this.toKeywords(question.expected_answer_keywords),
      parent_sequence_number: null,
    };
  }

  private toQuestionType(value: unknown): QuestionType {
    const normalized = String(value || '').trim().toUpperCase();

    if (Object.values(QuestionType).includes(normalized as QuestionType)) {
      return normalized as QuestionType;
    }

    return QuestionType.TECHNICAL;
  }

  private toDifficultyLevel(value: unknown): DifficultyLevel {
    const normalized = String(value || '').trim().toUpperCase();

    if (Object.values(DifficultyLevel).includes(normalized as DifficultyLevel)) {
      return normalized as DifficultyLevel;
    }

    return DifficultyLevel.MEDIUM;
  }

  private toGeneratedFrom(value: unknown): GeneratedFrom {
    const normalized = String(value || '').trim().toUpperCase();

    if (Object.values(GeneratedFrom).includes(normalized as GeneratedFrom)) {
      return normalized as GeneratedFrom;
    }

    return GeneratedFrom.RESUME_ANALYSIS;
  }

  private toKeywords(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .map((entry) => String(entry || '').trim())
          .filter(Boolean),
      ),
    ).slice(0, 8);
  }
}
