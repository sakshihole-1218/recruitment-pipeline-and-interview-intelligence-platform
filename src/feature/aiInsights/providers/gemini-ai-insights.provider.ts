import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import { GeminiClient } from '../../../common/ai/gemini/gemini.client';
import { GeminiJsonHelper } from '../../../common/ai/gemini/gemini-json.helper';
import { FinalAiRecommendation } from '../enums/final-ai-recommendation.enum';
import { GeminiAiInsightsPromptHelper } from '../helpers/gemini-ai-insights-prompt.helper';
import { CandidateDocumentEntity } from '../../candidates/entities/candidate-document.entity';

import {
  AiInsightsProvider,
  AnalyzeResumeInput,
  AnalyzeResumeOutput,
  GenerateFeedbackSummaryInput,
  GenerateFeedbackSummaryOutput,
} from './ai-insights-provider';

type GeminiResumeAnalysisResponse = {
  candidate_name?: string;
  email?: string;
  phone?: string;
  skills?: unknown;
  experience_years?: number | string | null;
  education?: unknown;
  projects?: unknown;
  certifications?: unknown;
  experience_summary?: string | null;
  education_summary?: string | null;
  project_summary?: string | null;
  certification_summary?: string | null;
  ai_fit_score?: number | string | null;
  extracted_text?: string | null;
};

type GeminiFeedbackSummaryResponse = {
  summary_text?: string;
  strengths_summary?: string | null;
  concerns_summary?: string | null;
  technical_summary?: string | null;
  communication_summary?: string | null;
  overall_score?: number | string | null;
  technical_score?: number | string | null;
  communication_score?: number | string | null;
  problem_solving_score?: number | string | null;
  culture_fit_score?: number | string | null;
  final_ai_recommendation?: string | null;
};

@Injectable()
export class GeminiAiInsightsProvider implements AiInsightsProvider {
  private readonly logger = new Logger(GeminiAiInsightsProvider.name);

  constructor(
    private readonly geminiClient: GeminiClient,
    @InjectRepository(CandidateDocumentEntity)
    private readonly candidateDocRepo: Repository<CandidateDocumentEntity>,
  ) {}

  async analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
    let resolvedExtractedText = String(input.extractedText || '').trim();
    let promptContents: string | any[] = '';

    if (!resolvedExtractedText) {
      const doc = await this.candidateDocRepo.findOneBy({
        id: input.candidateDocumentId,
      });

      if (!doc) {
        throw new Error(
          `Candidate document with ID ${input.candidateDocumentId} not found`,
        );
      }

      const isPdf =
        doc.mime_type === 'application/pdf' ||
        doc.file_name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        throw new Error(
          'Gemini AI provider currently only supports analyzing PDF files natively. ' +
            'Please upload a PDF resume or provide extracted text manually.',
        );
      }

      const filePath = path.join(process.cwd(), doc.file_url);
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Candidate document file not found on disk at: ${filePath}`,
        );
      }

      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      const promptText = GeminiAiInsightsPromptHelper.buildResumeAnalysisPrompt(
        '[Attached PDF Document]',
      );

      promptContents = [
        { text: promptText },
        {
          inlineData: {
            mimeType: doc.mime_type || 'application/pdf',
            data: base64Data,
          },
        },
      ];
    } else {
      promptContents = GeminiAiInsightsPromptHelper.buildResumeAnalysisPrompt(
        resolvedExtractedText,
      );
    }

    try {
      const responseText = await this.geminiClient.generateText({
        prompt: promptContents,
        responseMimeType: 'application/json',
      });

      const parsed =
        GeminiJsonHelper.parseJson<GeminiResumeAnalysisResponse>(responseText);

      const skills = this.toStringArray(parsed.skills);
      const education = this.toObjectArray(parsed.education);
      const projects = this.toObjectArray(parsed.projects);
      const certifications = this.toValueArray(parsed.certifications);
      const experienceYears = this.toNullableNumber(parsed.experience_years);
      const aiFitScore = this.toScore(parsed.ai_fit_score, 'ai_fit_score');

      if (!resolvedExtractedText) {
        resolvedExtractedText =
          this.toText(parsed.extracted_text) ||
          '[PDF Resume document content analyzed directly by Gemini]';
      }

      return {
        extracted_text: resolvedExtractedText,
        parsed_resume_json: {
          candidate_name: this.toText(parsed.candidate_name),
          email: this.toText(parsed.email),
          phone: this.toText(parsed.phone),
          skills,
          experience_years: experienceYears ?? 0,
          education,
          projects,
          certifications,
          experience_summary: this.toText(parsed.experience_summary),
          education_summary: this.toText(parsed.education_summary),
          project_summary: this.toText(parsed.project_summary),
          certification_summary: this.toText(parsed.certification_summary),
          ai_fit_score: aiFitScore,
          extracted_text: resolvedExtractedText,
          context: {
            candidate_id: input.candidateId,
            candidate_document_id: input.candidateDocumentId,
            application_id: input.applicationId ?? null,
          },
        },
        skills_extracted: {
          skills,
          total: skills.length,
        },
        experience_summary: this.toText(parsed.experience_summary),
        education_summary: this.toText(parsed.education_summary),
        project_summary: this.toText(parsed.project_summary),
        certification_summary: this.toText(parsed.certification_summary),
        total_experience_years_detected: experienceYears,
        ai_fit_score: aiFitScore,
      };
    } catch (error) {
      this.logger.warn('Gemini resume analysis failed');
      throw error;
    }
  }

  async generateFeedbackSummary(
    input: GenerateFeedbackSummaryInput,
  ): Promise<GenerateFeedbackSummaryOutput> {
    try {
      const responseText = await this.geminiClient.generateText({
        prompt: GeminiAiInsightsPromptHelper.buildFeedbackSummaryPrompt(
          input,
          input.feedbacks ?? [],
        ),
        responseMimeType: 'application/json',
      });

      const parsed =
        GeminiJsonHelper.parseJson<GeminiFeedbackSummaryResponse>(responseText);

      return {
        summary_text:
          this.toText(parsed.summary_text) ||
          `AI feedback summary for application ${input.applicationId}`,
        strengths_summary: this.toNullableText(parsed.strengths_summary),
        concerns_summary: this.toNullableText(parsed.concerns_summary),
        technical_summary: this.toNullableText(parsed.technical_summary),
        communication_summary: this.toNullableText(
          parsed.communication_summary,
        ),
        overall_score: this.toNullableTenPointScore(parsed.overall_score),
        technical_score: this.toNullableTenPointScore(parsed.technical_score),
        communication_score: this.toNullableTenPointScore(
          parsed.communication_score,
        ),
        problem_solving_score: this.toNullableTenPointScore(
          parsed.problem_solving_score,
        ),
        culture_fit_score: this.toNullableTenPointScore(
          parsed.culture_fit_score,
        ),
        final_ai_recommendation: this.toFinalRecommendation(
          parsed.final_ai_recommendation,
          parsed.overall_score,
        ),
      };
    } catch (error) {
      this.logger.warn('Gemini feedback summary generation failed');
      throw error;
    }
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(value.map((entry) => String(entry || '').trim()).filter(Boolean)),
    );
  }

  private toObjectArray(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((entry): entry is Record<string, unknown> => {
      return Boolean(
        entry && typeof entry === 'object' && !Array.isArray(entry),
      );
    });
  }

  private toValueArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private toNullableNumber(
    value: number | string | null | undefined,
  ): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new Error('Gemini returned invalid numeric value');
    }

    return Number(numeric.toFixed(2));
  }

  private toScore(
    value: number | string | null | undefined,
    fieldName: string,
  ): number {
    const numeric = this.toNullableNumber(value);

    if (numeric === null || numeric < 0 || numeric > 100) {
      throw new Error(`Gemini returned invalid ${fieldName}`);
    }

    return Number(numeric.toFixed(2));
  }

  private toNullableTenPointScore(
    value: number | string | null | undefined,
  ): number | null {
    const numeric = this.toNullableNumber(value);

    if (numeric === null) {
      return null;
    }

    if (numeric < 0 || numeric > 10) {
      throw new Error('Gemini returned invalid 10-point score');
    }

    return Number(numeric.toFixed(2));
  }

  private toText(value: unknown): string {
    return String(value || '').trim();
  }

  private toNullableText(value: unknown): string | null {
    const text = this.toText(value);
    return text || null;
  }

  private toFinalRecommendation(
    value: string | null | undefined,
    overallScore: number | string | null | undefined,
  ): FinalAiRecommendation {
    const normalized = String(value || '')
      .trim()
      .toUpperCase();

    if (
      Object.values(FinalAiRecommendation).includes(
        normalized as FinalAiRecommendation,
      )
    ) {
      return normalized as FinalAiRecommendation;
    }

    const score = this.toNullableTenPointScore(overallScore);
    const normalizedHundredPoint = score === null ? 55 : score * 10;

    if (normalizedHundredPoint <= 39)
      return FinalAiRecommendation.STRONGLY_REJECT;
    if (normalizedHundredPoint <= 54) return FinalAiRecommendation.REJECT;
    if (normalizedHundredPoint <= 69) return FinalAiRecommendation.HOLD;
    if (normalizedHundredPoint <= 84) return FinalAiRecommendation.SELECT;
    return FinalAiRecommendation.STRONGLY_SELECT;
  }
}
