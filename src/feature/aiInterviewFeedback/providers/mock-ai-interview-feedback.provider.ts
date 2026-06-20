import { Injectable } from '@nestjs/common';

import { TranscriptSpeakerType } from '../../aiInterviewTranscripts/enums/transcript-speaker-type.enum';

import { AiInterviewRecommendation } from '../enums/ai-interview-recommendation.enum';

import {
  AiInterviewFeedbackProvider,
  GenerateAiInterviewFeedbackInput,
  GenerateAiInterviewFeedbackOutput,
} from './ai-interview-feedback-provider';

@Injectable()
export class MockAiInterviewFeedbackProvider implements AiInterviewFeedbackProvider {
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

    const technicalScore = this.clamp(
      42 +
        questionCoverage * 22 +
        Math.min(architectureMentions * 4, 18) +
        Math.min(resumeSkillCount, 10),
    );
    const communicationScore = this.clamp(
      40 +
        Math.min(avgWordsPerAnswer / 4, 25) +
        Math.min(communicationMentions * 3, 20),
    );
    const problemSolvingScore = this.clamp(
      38 + questionCoverage * 18 + Math.min(problemSolvingMentions * 5, 26),
    );
    const projectUnderstandingScore = this.clamp(
      35 +
        Math.min(architectureMentions * 5, 25) +
        Math.min(avgWordsPerAnswer / 5, 20),
    );
    const answerRelevanceScore = this.clamp(
      45 + questionCoverage * 30 + Math.min(answeredQuestionIds.size * 2, 12),
    );
    const confidenceScore = this.clamp(
      41 +
        Math.min(candidateEntries.length * 4, 20) +
        Math.min(avgWordsPerAnswer / 6, 18),
    );

    const overallScore = this.average([
      technicalScore,
      communicationScore,
      problemSolvingScore,
      projectUnderstandingScore,
      answerRelevanceScore,
      confidenceScore,
    ]);

    const recommendation = this.toRecommendation(overallScore);

    return {
      technical_score: technicalScore,
      communication_score: communicationScore,
      problem_solving_score: problemSolvingScore,
      project_understanding_score: projectUnderstandingScore,
      answer_relevance_score: answerRelevanceScore,
      confidence_score: confidenceScore,
      overall_score: overallScore,
      technical_summary: `The candidate demonstrated ${this.bandLabel(technicalScore)} technical depth with notable references to architecture, APIs, and implementation trade-offs.`,
      communication_summary: `The candidate showed ${this.bandLabel(communicationScore)} communication clarity with reasonably structured explanations and supporting examples.`,
      problem_solving_summary: `The responses reflected ${this.bandLabel(problemSolvingScore)} problem-solving ability, particularly in discussing debugging, performance, and decision-making trade-offs.`,
      project_understanding_summary: `Project understanding appears ${this.bandLabel(projectUnderstandingScore)}, with the candidate describing system components, responsibilities, and implementation context in a coherent way.`,
      strengths: this.buildStrengths(
        technicalScore,
        communicationScore,
        problemSolvingScore,
      ),
      concerns: this.buildConcerns(answerRelevanceScore, confidenceScore),
      improvement_areas: this.buildImprovementAreas(
        projectUnderstandingScore,
        answerRelevanceScore,
      ),
      ai_recommendation: recommendation,
      raw_ai_payload: {
        provider: 'mock-ai-interview-feedback',
        signals: {
          candidate_entry_count: candidateEntries.length,
          total_candidate_words: totalCandidateWords,
          average_words_per_answer: Number(avgWordsPerAnswer.toFixed(2)),
          question_coverage: Number(questionCoverage.toFixed(4)),
          architecture_mentions: architectureMentions,
          problem_solving_mentions: problemSolvingMentions,
          communication_mentions: communicationMentions,
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
    return Number(Math.max(0, Math.min(100, score)).toFixed(2));
  }

  private average(values: number[]): number {
    const total = values.reduce((sum, value) => sum + value, 0);
    return Number((total / values.length).toFixed(2));
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

  private buildConcerns(
    answerRelevanceScore: number,
    confidenceScore: number,
  ): string {
    const concerns: string[] = [];

    if (answerRelevanceScore < 60) {
      concerns.push('Some answers do not fully address the question intent');
    }
    if (confidenceScore < 60) {
      concerns.push(
        'Response delivery lacks consistency and assertiveness in places',
      );
    }

    if (!concerns.length) {
      concerns.push(
        'No major risks were detected from the transcript alone, but human review remains necessary',
      );
    }

    return concerns.join('. ');
  }

  private buildImprovementAreas(
    projectUnderstandingScore: number,
    answerRelevanceScore: number,
  ): string {
    const areas: string[] = [];

    if (projectUnderstandingScore < 70) {
      areas.push(
        'Explain project architecture and ownership boundaries in more depth',
      );
    }
    if (answerRelevanceScore < 70) {
      areas.push(
        'Give more direct, question-focused responses with stronger examples',
      );
    }

    if (!areas.length) {
      areas.push(
        'Continue strengthening quantified examples and decision rationale in technical answers',
      );
    }

    return areas.join('. ');
  }
}
