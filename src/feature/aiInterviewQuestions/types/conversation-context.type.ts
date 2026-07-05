import { DifficultyLevel } from '../enums/difficulty-level.enum';
import { QuestionType } from '../enums/question-type.enum';

export type ConversationContextTurn = {
  questionId: string;
  parentQuestionId: string | null;
  questionText: string;
  topic: string;
  questionType: QuestionType;
  difficultyLevel: DifficultyLevel;
  isFollowUp: boolean;
  answerText: string | null;
  answerWordCount: number;
  sequenceNumber: number;
};

export type ConversationContextWeakArea = {
  topic: string;
  reason: string;
  relatedQuestionId: string;
};

export type ConversationContextContradiction = {
  topic: string;
  detail: string;
};

export type ConversationContext = {
  resumeSummary: string | null;
  candidateExperienceSummary: string | null;
  skills: string[];
  previousQuestions: string[];
  previousAnswers: string[];
  followUps: string[];
  discussedTopics: string[];
  unansweredTopics: string[];
  weakAreas: ConversationContextWeakArea[];
  potentialContradictions: ConversationContextContradiction[];
  candidateLevel: 'JUNIOR' | 'MID' | 'SENIOR';
  recentTurns: ConversationContextTurn[];
  olderConversationSummary: string | null;
};
