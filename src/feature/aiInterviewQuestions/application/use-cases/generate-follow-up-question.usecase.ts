import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AiInterviewTranscriptRepository } from '../../../aiInterviewTranscripts/repositories/ai-interview-transcript.repository';

import { AiInterviewQuestionEntity } from '../../entities/ai-interview-question.entity';
import { DifficultyLevel } from '../../enums/difficulty-level.enum';
import { GeneratedFrom } from '../../enums/generated-from.enum';
import { QuestionSource } from '../../enums/question-source.enum';
import { QuestionStatus } from '../../enums/question-status.enum';
import { QuestionType } from '../../enums/question-type.enum';
import { AiInterviewQuestionsValidationHelper } from '../../helpers/ai-interview-questions-validation.helper';
import {
  AI_INTERVIEW_QUESTION_PROVIDER,
  AiInterviewQuestionProvider,
} from '../../providers/ai-interview-question-provider';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';
import { AiInterviewQuestionsReferenceRepository } from '../../repositories/ai-interview-questions-reference.repository';

@Injectable()
export class GenerateFollowUpQuestionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewQuestionRepository,
    private readonly transcriptRepository: AiInterviewTranscriptRepository,
    private readonly referenceRepository: AiInterviewQuestionsReferenceRepository,
    private readonly validation: AiInterviewQuestionsValidationHelper,
    @Inject(AI_INTERVIEW_QUESTION_PROVIDER)
    private readonly provider: AiInterviewQuestionProvider,
  ) {}

  async execute(
    questionId: string,
    actorUserId?: string,
  ): Promise<AiInterviewQuestionEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

    return this.dataSource.transaction(async (manager) => {
      const question = await this.repository.findById(questionId, {
        manager,
        lockForUpdate: true,
      });

      if (!question) {
        throw new NotFoundException({
          message: 'AI interview question not found',
          code: 'AI_INTERVIEW_QUESTION_NOT_FOUND',
        });
      }

      const session = await this.referenceRepository.findSessionById(
        question.ai_interview_session_id,
        {
          manager,
          lockForUpdate: true,
        },
      );

      if (!session) {
        throw new NotFoundException({
          message: 'AI interview session not found',
          code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
        });
      }

      const sessionQuestions = await this.repository.findBySessionId(
        session.id,
        {
          manager,
        },
      );
      const rootQuestion = this.resolveRootQuestion(question, sessionQuestions);
      const rootFollowUps = this.findRootFollowUps(
        rootQuestion.id,
        sessionQuestions,
      );

      this.validation.ensureFollowUpLimitNotReached(rootFollowUps.length);

      const transcriptEntries =
        await this.transcriptRepository.findCandidateEntriesByQuestionId(
          question.id,
          { manager },
        );

      if (!transcriptEntries.length) {
        throw new NotFoundException({
          message: 'Candidate transcript not found for this question',
          code: 'AI_INTERVIEW_TRANSCRIPT_NOT_FOUND',
        });
      }

      const candidateAnswer = transcriptEntries
        .map((entry) => entry.message_text.trim())
        .filter(Boolean)
        .join(' ')
        .trim();

      this.validation.ensureTranscriptHasContent(candidateAnswer);

      const candidate = await this.referenceRepository.findCandidateById(
        session.candidate_id,
        manager,
      );

      if (!candidate) {
        throw new NotFoundException({
          message: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      const resumeAnalysis = session.resume_analysis_id
        ? await this.referenceRepository.findResumeAnalysisById(
            session.resume_analysis_id,
            manager,
          )
        : null;

      const candidateSkills = this.extractCandidateSkills(
        resumeAnalysis?.skills_extracted,
      );

      const generated = await this.provider.generateFollowUpQuestion({
        sessionId: session.id,
        parentQuestion: {
          id: question.id,
          questionText: question.question_text,
          topic: question.topic,
          difficultyLevel: question.difficulty_level,
          questionType: question.question_type,
        },
        candidateAnswer,
        resumeAnalysis: resumeAnalysis
          ? {
              id: resumeAnalysis.id,
              experienceSummary: resumeAnalysis.experience_summary,
              projectSummary: resumeAnalysis.project_summary,
              skillsExtracted: resumeAnalysis.skills_extracted,
              totalExperienceYearsDetected:
                resumeAnalysis.total_experience_years_detected,
            }
          : null,
        candidateExperience:
          resumeAnalysis?.total_experience_years_detected ||
          candidate.total_experience_years,
        candidateSkills,
        previousFollowUps: rootFollowUps.map(
          (followUp) => followUp.question_text,
        ),
      });

      this.validation.ensureNoDuplicateFollowUp(generated.followUpQuestion, [
        ...sessionQuestions.map((item) => item.question_text),
        candidateAnswer,
      ]);

      const insertionSequence = this.getInsertionSequence(
        rootQuestion,
        rootFollowUps,
        sessionQuestions,
      );

      await this.repository.shiftSequenceNumbersForInsert(
        session.id,
        insertionSequence,
        { manager },
      );

      const createdQuestion = await this.repository.createQuestion(
        {
          ai_interview_session_id: session.id,
          parent_question_id: question.id,
          question_text: generated.followUpQuestion.trim(),
          question_type: QuestionType.TECHNICAL,
          topic: generated.category.trim() || question.topic,
          difficulty_level: this.resolveDifficulty(
            generated.difficulty,
            question.difficulty_level,
          ),
          sequence_number: insertionSequence,
          is_follow_up: true,
          question_source: QuestionSource.FOLLOW_UP,
          generated_from: GeneratedFrom.FOLLOW_UP_ENGINE,
          question_status: QuestionStatus.PENDING,
          expected_answer_keywords: null,
          follow_up_reasoning: generated.reasoning.trim(),
          asked_at: null,
          answered_at: null,
          is_answered: false,
          created_by_user_id: actorUserId,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      if (!question.answered_at) {
        const now = new Date();
        question.asked_at = question.asked_at ?? now;
        question.answered_at = now;
        question.is_answered = true;
        question.question_status = QuestionStatus.ANSWERED;
        question.updated_by_user_id = actorUserId;
        await this.repository.updateQuestion(question, { manager });
      }

      return createdQuestion;
    });
  }

  private resolveRootQuestion(
    question: AiInterviewQuestionEntity,
    sessionQuestions: AiInterviewQuestionEntity[],
  ): AiInterviewQuestionEntity {
    const questionsById = new Map(
      sessionQuestions.map((item) => [item.id, item]),
    );
    let current = question;

    while (current.parent_question_id) {
      const parent = questionsById.get(current.parent_question_id);
      if (!parent) {
        break;
      }
      current = parent;
    }

    return current;
  }

  private findRootFollowUps(
    rootQuestionId: string,
    sessionQuestions: AiInterviewQuestionEntity[],
  ): AiInterviewQuestionEntity[] {
    const questionsById = new Map(
      sessionQuestions.map((item) => [item.id, item]),
    );

    return sessionQuestions.filter((item) => {
      if (!item.parent_question_id) {
        return false;
      }

      let current: AiInterviewQuestionEntity | undefined = item;
      while (current?.parent_question_id) {
        const parent = questionsById.get(current.parent_question_id);
        if (!parent) {
          return false;
        }
        if (parent.id === rootQuestionId) {
          return true;
        }
        current = parent;
      }

      return false;
    });
  }

  private getInsertionSequence(
    rootQuestion: AiInterviewQuestionEntity,
    rootFollowUps: AiInterviewQuestionEntity[],
    sessionQuestions: AiInterviewQuestionEntity[],
  ): number {
    const maxChainSequence = Math.max(
      rootQuestion.sequence_number,
      ...rootFollowUps.map((item) => item.sequence_number),
    );

    const nextQuestion = sessionQuestions.find(
      (item) => item.sequence_number > maxChainSequence,
    );

    return nextQuestion?.sequence_number ?? maxChainSequence + 1;
  }

  private extractCandidateSkills(value: unknown): string[] {
    const rawSkills =
      value && typeof value === 'object'
        ? (value as { skills?: unknown }).skills
        : null;

    if (!Array.isArray(rawSkills)) {
      return [];
    }

    return Array.from(
      new Set(
        rawSkills.map((skill) => String(skill || '').trim()).filter(Boolean),
      ),
    ).slice(0, 12);
  }

  private resolveDifficulty(
    difficulty: DifficultyLevel,
    fallback: DifficultyLevel,
  ): DifficultyLevel {
    return Object.values(DifficultyLevel).includes(difficulty)
      ? difficulty
      : fallback;
  }
}
