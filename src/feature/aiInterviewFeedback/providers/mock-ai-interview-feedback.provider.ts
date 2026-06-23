import { Injectable } from '@nestjs/common';

import { TranscriptSpeakerType } from '../../aiInterviewTranscripts/enums/transcript-speaker-type.enum';

import { AiInterviewRecommendation } from '../enums/ai-interview-recommendation.enum';

import {
  GenerateAiInterviewFeedbackInput,
  GenerateAiInterviewFeedbackOutput,
  InterviewEvaluationProvider,
} from './ai-interview-feedback-provider';

@Injectable()
export class MockInterviewEvaluationProvider
  implements InterviewEvaluationProvider
{
  async generateFeedback(
    input: GenerateAiInterviewFeedbackInput,
  ): Promise<GenerateAiInterviewFeedbackOutput> {
    const candidateEntries = input.transcripts.filter(
      (entry) => entry.speaker_type === TranscriptSpeakerType.CANDIDATE,
    );

    const totalCandidateWords = candidateEntries.reduce((sum, entry) => {
      return sum + this.wordCount(entry.message_text);
    }, 0);

    const avgWordsPerAnswer = candidateEntries.length
      ? totalCandidateWords / candidateEntries.length
      : 0;

    const answeredQuestionIds = new Set(
      candidateEntries
        .map((entry) => entry.ai_interview_question_id)
        .filter((value): value is string => Boolean(value)),
    );

    const questionCoverage = input.questions.length
      ? answeredQuestionIds.size / input.questions.length
      : candidateEntries.length
        ? 0.65
        : 0;

    const transcriptText = candidateEntries
      .map((entry) => entry.message_text)
      .join(' ')
      .toLowerCase();

    const resumeSkillCount = this.extractResumeSkillCount(
      input.resume_analysis?.skills_extracted,
    );
    const architectureMentions = this.keywordHits(transcriptText, [
      'architecture',
      'design',
      'scalable',
      'microservice',
      'database',
      'api',
      'service',
    ]);
    const problemSolvingMentions = this.keywordHits(transcriptText, [
      'debug',
      'issue',
      'problem',
      'optimized',
      'fixed',
      'trade-off',
      'performance',
    ]);
    const communicationMentions = this.keywordHits(transcriptText, [
      'because',
      'therefore',
      'approach',
      'example',
      'impact',
      'result',
    ]);
    const resumeAlignmentSignals = this.keywordHits(transcriptText, [
      'experience',
      'project',
      'ownership',
      'responsible',
      'delivered',
      'implemented',
    ]);

    const technicalScore = this.clamp(
      4.2 +
        questionCoverage * 2.2 +
        Math.min(architectureMentions * 0.4, 1.8) +
        Math.min(resumeSkillCount * 0.12, 1.0),
    );
    const communicationScore = this.clamp(
      4 +
        Math.min(avgWordsPerAnswer / 40, 2.5) +
        Math.min(communicationMentions * 0.35, 2),
    );
    const problemSolvingScore = this.clamp(
      3.8 + questionCoverage * 1.8 + Math.min(problemSolvingMentions * 0.55, 2.6),
    );
    const experienceRelevanceScore = this.clamp(
      4.1 +
        Math.min(resumeAlignmentSignals * 0.45, 2.5) +
        Math.min(questionCoverage * 2.2, 2.2) +
        Math.min(avgWordsPerAnswer / 55, 1.4),
    );

    const overallScore = this.average([
      technicalScore,
      communicationScore,
      problemSolvingScore,
      experienceRelevanceScore,
    ]);

    const recommendation = this.toRecommendation(overallScore);

    return {
      technical_score: technicalScore,
      communication_score: communicationScore,
      problem_solving_score: problemSolvingScore,
      experience_relevance_score: experienceRelevanceScore,
      overall_score: overallScore,
      strengths_summary: this.buildStrengths(
        technicalScore,
        communicationScore,
        problemSolvingScore,
      ),
      weaknesses_summary: this.buildWeaknesses(
        communicationScore,
        experienceRelevanceScore,
      ),
      detailed_feedback: this.buildDetailedFeedback(
        technicalScore,
        communicationScore,
        problemSolvingScore,
        experienceRelevanceScore,
      ),
      technical_summary: `The candidate demonstrated ${this.bandLabel(technicalScore)} technical depth with references to implementation choices, architecture, and practical engineering trade-offs.`,
      communication_summary: `The candidate showed ${this.bandLabel(communicationScore)} communication clarity with reasonably structured explanations and supporting examples.`,
      problem_solving_summary: `The responses reflected ${this.bandLabel(problemSolvingScore)} analytical reasoning, especially in debugging, optimization, and trade-off discussions.`,
      experience_relevance_summary: `Experience relevance appears ${this.bandLabel(experienceRelevanceScore)}, with the candidate connecting prior work, ownership, and project exposure to the role context.`,
      recommendation: recommendation,
      evaluation_metadata: {
        provider: 'mock-ai-interview-feedback',
        signals: {
          candidate_entry_count: candidateEntries.length,
          total_candidate_words: totalCandidateWords,
          average_words_per_answer: Number(avgWordsPerAnswer.toFixed(2)),
          question_coverage: Number(questionCoverage.toFixed(4)),
          architecture_mentions: architectureMentions,
          problem_solving_mentions: problemSolvingMentions,
          communication_mentions: communicationMentions,
          resume_alignment_signals: resumeAlignmentSignals,
          resume_skill_count: resumeSkillCount,
        },
      },
    };
  }

  private wordCount(value: string): number {
    const normalized = String(value || '').trim();
    return normalized ? normalized.split(/\s+/).length : 0;
  }

  private keywordHits(text: string, keywords: string[]): number {
    return keywords.reduce((sum, keyword) => {
      return sum + (text.includes(keyword) ? 1 : 0);
    }, 0);
  }

  private extractResumeSkillCount(value: unknown): number {
    if (!value || typeof value !== 'object') {
      return 0;
    }

    const skills = (value as { skills?: unknown }).skills;
    return Array.isArray(skills) ? skills.length : 0;
  }

  private clamp(score: number): number {
    return Number(Math.max(0, Math.min(10, score)).toFixed(2));
  }

  private average(values: number[]): number {
    const total = values.reduce((sum, value) => sum + value, 0);
    return Number(((total / values.length) * 10).toFixed(2));
  }

  private toRecommendation(score: number): AiInterviewRecommendation {
    if (score <= 39) {
      return AiInterviewRecommendation.STRONGLY_REJECT;
    }
    if (score <= 54) {
      return AiInterviewRecommendation.REJECT;
    }
    if (score <= 69) {
      return AiInterviewRecommendation.HOLD;
    }
    if (score <= 84) {
      return AiInterviewRecommendation.SELECT;
    }
    return AiInterviewRecommendation.STRONGLY_SELECT;
  }

  private bandLabel(score: number): string {
    if (score >= 85) {
      return 'strong';
    }
    if (score >= 70) {
      return 'good';
    }
    if (score >= 55) {
      return 'moderate';
    }
    return 'limited';
  }

  private buildStrengths(
    technicalScore: number,
    communicationScore: number,
    problemSolvingScore: number,
  ): string {
    const strengths: string[] = [];

    if (technicalScore >= 70) {
      strengths.push(
        'Shows solid technical grounding and practical engineering exposure',
      );
    }
    if (communicationScore >= 70) {
      strengths.push(
        'Communicates answers with reasonable clarity and structure',
      );
    }
    if (problemSolvingScore >= 70) {
      strengths.push(
        'Demonstrates useful debugging and problem-solving instincts',
      );
    }

    if (!strengths.length) {
      strengths.push(
        'Provides some relevant context from prior work and project experience',
      );
    }

    return strengths.join('. ');
  }

  private buildWeaknesses(
    communicationScore: number,
    experienceRelevanceScore: number,
  ): string {
    const weaknesses: string[] = [];

    if (communicationScore < 6) {
      weaknesses.push(
        'Some responses could be clearer, more structured, and more direct',
      );
    }
    if (experienceRelevanceScore < 6) {
      weaknesses.push(
        'The transcript shows limited role-specific alignment or ownership detail in parts of the discussion',
      );
    }

    if (!weaknesses.length) {
      weaknesses.push(
        'No major weaknesses were obvious from the transcript alone, though human review should still validate depth and consistency',
      );
    }

    return weaknesses.join('. ');
  }

  private buildDetailedFeedback(
    technicalScore: number,
    communicationScore: number,
    problemSolvingScore: number,
    experienceRelevanceScore: number,
  ): string {
    return [
      `Technical performance was ${this.bandLabel(technicalScore)} overall, with signs of practical implementation familiarity.`,
      `Communication was ${this.bandLabel(communicationScore)}, and explanations were ${
        communicationScore >= 7 ? 'mostly structured and understandable' : 'in need of tighter structure and clearer articulation'
      }.`,
      `Problem solving appeared ${this.bandLabel(problemSolvingScore)}, based on how the candidate discussed debugging, trade-offs, and reasoning.`,
      `Experience relevance was ${this.bandLabel(experienceRelevanceScore)}, reflecting how well prior work aligned with the role and the resume context.`,
    ].join(' ');
  }
}
