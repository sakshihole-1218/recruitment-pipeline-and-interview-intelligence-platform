import { Injectable } from '@nestjs/common';

import { CandidateEntity } from '../../../candidates/entities/candidate.entity';
import { ResumeAiAnalysisEntity } from '../../../aiInsights/entities/resume-ai-analysis.entity';
import { AiInterviewSessionEntity } from '../../../aiInterviewSessions/entities/ai-interview-session.entity';
import { AiInterviewTranscriptEntity } from '../../../aiInterviewTranscripts/entities/ai-interview-transcript.entity';
import { TranscriptSpeakerType } from '../../../aiInterviewTranscripts/enums/transcript-speaker-type.enum';

import { AiInterviewQuestionEntity } from '../../entities/ai-interview-question.entity';
import {
  ConversationContext,
  ConversationContextContradiction,
  ConversationContextTurn,
  ConversationContextWeakArea,
} from '../../types/conversation-context.type';

type BuildConversationContextInput = {
  session: AiInterviewSessionEntity;
  candidate: CandidateEntity;
  currentQuestion: AiInterviewQuestionEntity;
  questions: AiInterviewQuestionEntity[];
  transcripts: AiInterviewTranscriptEntity[];
  resumeAnalysis?: ResumeAiAnalysisEntity | null;
};

@Injectable()
export class AiInterviewConversationMemoryService {
  private readonly maxRecentTurns = 6;
  private readonly maxOlderSummaryTurns = 8;

  buildContext(input: BuildConversationContextInput): ConversationContext {
    const orderedQuestions = [...input.questions].sort(
      (a, b) => a.sequence_number - b.sequence_number,
    );
    const questionSequenceMap = new Map(
      orderedQuestions.map((question) => [question.id, question.sequence_number]),
    );
    const orderedTranscripts = [...input.transcripts].sort((a, b) => {
      const left = a.sequence_number ?? Number.MAX_SAFE_INTEGER;
      const right = b.sequence_number ?? Number.MAX_SAFE_INTEGER;
      return left - right;
    });

    const turns = orderedQuestions
      .filter(
        (question) =>
          question.sequence_number <= input.currentQuestion.sequence_number,
      )
      .map((question) =>
        this.toTurn(question, orderedTranscripts, questionSequenceMap),
      );

    const completedTurns = turns.filter((turn) => turn.answerText);
    const recentTurns = completedTurns.slice(-this.maxRecentTurns);
    const olderTurns = completedTurns.slice(
      0,
      Math.max(0, completedTurns.length - recentTurns.length),
    );

    const discussedTopics = Array.from(
      new Set(
        completedTurns
          .flatMap((turn) => this.expandTopicTags(turn.topic, turn.questionText))
          .filter(Boolean),
      ),
    ).slice(0, 16);

    const unansweredTopics = orderedQuestions
      .filter(
        (question) =>
          question.sequence_number >= input.currentQuestion.sequence_number &&
          !turns.some(
            (turn) => turn.questionId === question.id && Boolean(turn.answerText),
          ),
      )
      .map((question) => question.topic.trim())
      .filter(Boolean)
      .filter((topic, index, list) => list.indexOf(topic) === index)
      .slice(0, 10);

    const weakAreas = this.identifyWeakAreas(completedTurns);
    const contradictions = this.identifyPotentialContradictions(
      completedTurns,
      this.extractSkills(input.resumeAnalysis?.skills_extracted),
    );

    return {
      resumeSummary: this.composeResumeSummary(input.resumeAnalysis),
      candidateExperienceSummary: this.composeCandidateExperienceSummary(
        input.candidate,
        input.resumeAnalysis,
      ),
      skills: this.extractSkills(input.resumeAnalysis?.skills_extracted),
      previousQuestions: completedTurns.map((turn) => turn.questionText).slice(-12),
      previousAnswers: completedTurns
        .map((turn) => turn.answerText || '')
        .filter(Boolean)
        .slice(-12),
      followUps: turns
        .filter((turn) => turn.isFollowUp)
        .map((turn) => turn.questionText)
        .slice(-12),
      discussedTopics,
      unansweredTopics,
      weakAreas,
      potentialContradictions: contradictions,
      candidateLevel: this.resolveCandidateLevel(
        input.resumeAnalysis?.total_experience_years_detected ??
          input.candidate.total_experience_years,
      ),
      recentTurns,
      olderConversationSummary: this.summarizeOlderTurns(olderTurns),
    };
  }

  private toTurn(
    question: AiInterviewQuestionEntity,
    transcripts: AiInterviewTranscriptEntity[],
    questionSequenceMap: Map<string, number>,
  ): ConversationContextTurn {
    const answerText = transcripts
      .filter(
        (entry) =>
          entry.ai_interview_question_id === question.id &&
          entry.speaker_type === TranscriptSpeakerType.CANDIDATE,
      )
      .map((entry) => this.normalizeText(entry.message_text))
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      questionId: question.id,
      parentQuestionId: question.parent_question_id,
      questionText: this.normalizeText(question.question_text),
      topic: this.normalizeText(question.topic) || 'General',
      questionType: question.question_type,
      difficultyLevel: question.difficulty_level,
      isFollowUp: question.is_follow_up,
      answerText: answerText || null,
      answerWordCount: this.countWords(answerText),
      sequenceNumber:
        questionSequenceMap.get(question.id) ?? question.sequence_number,
    };
  }

  private composeResumeSummary(
    resumeAnalysis?: ResumeAiAnalysisEntity | null,
  ): string | null {
    if (!resumeAnalysis) {
      return null;
    }

    const parts = [
      resumeAnalysis.experience_summary,
      resumeAnalysis.project_summary,
      resumeAnalysis.education_summary,
      resumeAnalysis.certification_summary,
    ]
      .map((value) => this.normalizeText(value))
      .filter(Boolean);

    if (!parts.length) {
      return null;
    }

    return this.limitText(parts.join(' '), 900);
  }

  private composeCandidateExperienceSummary(
    candidate: CandidateEntity,
    resumeAnalysis?: ResumeAiAnalysisEntity | null,
  ): string | null {
    const parts = [
      [candidate.current_job_title, candidate.current_company]
        .filter(Boolean)
        .join(' at '),
      candidate.resume_headline,
      resumeAnalysis?.experience_summary,
    ]
      .map((value) => this.normalizeText(value))
      .filter(Boolean);

    if (!parts.length) {
      return null;
    }

    return this.limitText(parts.join('. '), 600);
  }

  private extractSkills(value: unknown): string[] {
    const rawSkills =
      value && typeof value === 'object'
        ? (value as { skills?: unknown }).skills
        : null;

    if (!Array.isArray(rawSkills)) {
      return [];
    }

    return Array.from(
      new Set(
        rawSkills.map((skill) => this.normalizeText(String(skill || ''))).filter(Boolean),
      ),
    ).slice(0, 16);
  }

  private identifyWeakAreas(
    turns: ConversationContextTurn[],
  ): ConversationContextWeakArea[] {
    const uncertaintyPattern =
      /\b(not sure|don't know|do not know|haven't used|have not used|never used|not familiar|can't recall|cannot recall)\b/i;

    return turns
      .filter((turn) => {
        const answer = turn.answerText || '';
        return turn.answerWordCount < 18 || uncertaintyPattern.test(answer);
      })
      .map((turn) => ({
        topic: turn.topic,
        relatedQuestionId: turn.questionId,
        reason:
          turn.answerWordCount < 18
            ? 'Candidate answer was brief and may lack depth.'
            : 'Candidate expressed uncertainty or limited hands-on experience.',
      }))
      .slice(-8);
  }

  private identifyPotentialContradictions(
    turns: ConversationContextTurn[],
    skills: string[],
  ): ConversationContextContradiction[] {
    const contradictionPattern =
      /\b(haven't used|have not used|never used|no experience with|not worked with)\b/i;

    const normalizedSkills = skills.map((skill) => skill.toLowerCase());

    return turns
      .filter((turn) => turn.answerText && contradictionPattern.test(turn.answerText))
      .map((turn) => {
        const answerLower = String(turn.answerText).toLowerCase();
        const matchedSkill = normalizedSkills.find((skill) =>
          answerLower.includes(skill),
        );

        if (!matchedSkill) {
          return {
            topic: turn.topic,
            detail:
              'Candidate described limited experience in an area that may need validation.',
          };
        }

        return {
          topic: turn.topic,
          detail: `Candidate reported limited experience with ${matchedSkill} despite it appearing in resume-derived skills.`,
        };
      })
      .slice(-6);
  }

  private resolveCandidateLevel(
    yearsOfExperience: string | null | undefined,
  ): 'JUNIOR' | 'MID' | 'SENIOR' {
    const numericYears = Number(yearsOfExperience);

    if (!Number.isFinite(numericYears)) {
      return 'MID';
    }

    if (numericYears >= 7) {
      return 'SENIOR';
    }

    if (numericYears >= 3) {
      return 'MID';
    }

    return 'JUNIOR';
  }

  private summarizeOlderTurns(turns: ConversationContextTurn[]): string | null {
    if (!turns.length) {
      return null;
    }

    return turns
      .slice(-this.maxOlderSummaryTurns)
      .map((turn) => {
        const answerSummary = this.limitText(turn.answerText || '', 120);
        return `Q: ${turn.questionText} | A: ${answerSummary || 'No answer captured.'}`;
      })
      .join('\n');
  }

  private expandTopicTags(topic: string, questionText: string): string[] {
    const base = [this.normalizeText(topic)];
    const keywordMatches = questionText.match(/[A-Za-z][A-Za-z0-9+#.]{2,}/g) || [];
    return [...base, ...keywordMatches.map((item) => this.normalizeText(item))]
      .filter(Boolean)
      .slice(0, 6);
  }

  private normalizeText(value: string | null | undefined): string {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private countWords(value: string | null | undefined): number {
    const normalized = this.normalizeText(value);
    return normalized ? normalized.split(/\s+/).length : 0;
  }

  private limitText(value: string, maxLength: number): string {
    const normalized = this.normalizeText(value);
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength - 3).trim()}...`;
  }
}
