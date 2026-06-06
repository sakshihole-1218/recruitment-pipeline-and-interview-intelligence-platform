import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { QuestionGenerationStatus } from '../../../aiInterviewSessions/enums/question-generation-status.enum';

import { GenerateInterviewPlanDto } from '../../dto/generate-interview-plan.dto';
import { AiInterviewQuestionEntity } from '../../entities/ai-interview-question.entity';
import { QuestionType } from '../../enums/question-type.enum';
import { AiInterviewQuestionsValidationHelper } from '../../helpers/ai-interview-questions-validation.helper';
import {
  AI_INTERVIEW_QUESTION_PROVIDER,
  AiInterviewQuestionProvider,
  GeneratedInterviewPlanQuestion,
} from '../../providers/ai-interview-question-provider';
import { AiInterviewQuestionRepository } from '../../repositories/ai-interview-question.repository';
import { AiInterviewQuestionsReferenceRepository } from '../../repositories/ai-interview-questions-reference.repository';

@Injectable()
export class GenerateInterviewPlanUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewQuestionRepository,
    private readonly referenceRepository: AiInterviewQuestionsReferenceRepository,
    private readonly validation: AiInterviewQuestionsValidationHelper,
    @Inject(AI_INTERVIEW_QUESTION_PROVIDER)
    private readonly provider: AiInterviewQuestionProvider,
  ) {}

  async execute(
    dto: GenerateInterviewPlanDto,
    actorUserId?: string,
  ): Promise<AiInterviewQuestionEntity[]> {
    this.validation.ensureActorUserRequired(actorUserId);

    let processingStarted = false;

    try {
      const generationContext = await this.dataSource.transaction(async (manager) => {
        const session = await this.referenceRepository.findSessionById(
          dto.ai_interview_session_id,
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

        this.validation.ensureSessionSupportsQuestionGeneration(session.session_status);
        this.validation.ensurePlanGenerationNotCompleted(
          session.question_generation_status,
        );

        const existingQuestions = await this.repository.findBySessionId(session.id, {
          manager,
        });

        if (existingQuestions.length > 0) {
          throw new ConflictException({
            message: 'Interview questions already exist for this session',
            code: 'AI_INTERVIEW_QUESTIONS_ALREADY_EXIST',
          });
        }

        if (!session.resume_analysis_id) {
          throw new NotFoundException({
            message: 'Resume analysis is not attached to the AI interview session',
            code: 'SESSION_RESUME_ANALYSIS_NOT_FOUND',
          });
        }

        const [resumeAnalysis, application, candidate] = await Promise.all([
          this.referenceRepository.findResumeAnalysisById(session.resume_analysis_id, manager),
          this.referenceRepository.findApplicationById(session.application_id, manager),
          this.referenceRepository.findCandidateById(session.candidate_id, manager),
        ]);

        if (!resumeAnalysis) {
          throw new NotFoundException({
            message: 'Resume analysis not found',
            code: 'RESUME_ANALYSIS_NOT_FOUND',
          });
        }

        if (!application) {
          throw new NotFoundException({
            message: 'Application not found',
            code: 'APPLICATION_NOT_FOUND',
          });
        }

        if (!candidate) {
          throw new NotFoundException({
            message: 'Candidate not found',
            code: 'CANDIDATE_NOT_FOUND',
          });
        }

        const jobOpening = await this.referenceRepository.findJobOpeningById(
          application.job_opening_id,
          manager,
        );

        if (!jobOpening) {
          throw new NotFoundException({
            message: 'Job opening not found',
            code: 'JOB_OPENING_NOT_FOUND',
          });
        }

        const jobSkills = await this.referenceRepository.listJobSkillsByJobOpeningId(
          jobOpening.id,
          manager,
        );

        session.question_generation_status = QuestionGenerationStatus.PROCESSING;
        session.updated_by_user_id = actorUserId;
        await this.referenceRepository.saveSession(session, manager);

        return {
          session,
          resumeAnalysis,
          application,
          candidate,
          jobOpening,
          jobSkills,
        };
      });

      processingStarted = true;

      const generatedQuestions = await this.provider.generateInterviewPlan({
        ai_interview_session_id: generationContext.session.id,
        candidate: {
          id: generationContext.candidate.id,
          full_name: `${generationContext.candidate.first_name} ${generationContext.candidate.last_name}`.trim(),
          current_job_title: generationContext.candidate.current_job_title,
          current_company: generationContext.candidate.current_company,
          resume_headline: generationContext.candidate.resume_headline,
          total_experience_years: generationContext.candidate.total_experience_years,
        },
        application: {
          id: generationContext.application.id,
        },
        job_opening: {
          id: generationContext.jobOpening.id,
          title: generationContext.jobOpening.title,
          requirements: generationContext.jobOpening.requirements,
          responsibilities: generationContext.jobOpening.responsibilities,
          experience_min_years: generationContext.jobOpening.experience_min_years,
          experience_max_years: generationContext.jobOpening.experience_max_years,
        },
        resume_analysis: {
          id: generationContext.resumeAnalysis.id,
          extracted_text: generationContext.resumeAnalysis.extracted_text,
          parsed_resume_json: generationContext.resumeAnalysis.parsed_resume_json,
          skills_extracted: generationContext.resumeAnalysis.skills_extracted,
          experience_summary: generationContext.resumeAnalysis.experience_summary,
          project_summary: generationContext.resumeAnalysis.project_summary,
          total_experience_years_detected:
            generationContext.resumeAnalysis.total_experience_years_detected,
        },
        job_skills: generationContext.jobSkills,
      });

      return this.dataSource.transaction(async (manager) => {
        const session = await this.referenceRepository.findSessionById(
          dto.ai_interview_session_id,
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

        const rootQuestions = generatedQuestions.filter(
          (question) => !question.parent_sequence_number,
        );
        const followUpQuestions = generatedQuestions.filter(
          (question) => question.parent_sequence_number,
        );

        const createdRoots = await this.repository.createManyQuestions(
          rootQuestions.map((question) =>
            this.toEntityPayload(
              question,
              session.id,
              actorUserId,
              question.question_type === QuestionType.FOLLOW_UP,
              null,
            ),
          ),
          { manager },
        );

        const rootQuestionMap = new Map<number, AiInterviewQuestionEntity>();
        createdRoots.forEach((question) => {
          rootQuestionMap.set(question.sequence_number, question);
        });

        const createdFollowUps = await this.repository.createManyQuestions(
          followUpQuestions.map((question) => {
            const parentQuestion = rootQuestionMap.get(
              Number(question.parent_sequence_number),
            );

            if (!parentQuestion) {
              throw new ConflictException({
                message: 'Generated follow-up question references an unknown parent',
                code: 'FOLLOW_UP_PARENT_SEQUENCE_INVALID',
                meta: {
                  parent_sequence_number: question.parent_sequence_number,
                },
              });
            }

            return this.toEntityPayload(
              question,
              session.id,
              actorUserId,
              true,
              parentQuestion.id,
            );
          }),
          { manager },
        );

        session.question_generation_status = QuestionGenerationStatus.COMPLETED;
        session.updated_by_user_id = actorUserId;
        await this.referenceRepository.saveSession(session, manager);

        return [...createdRoots, ...createdFollowUps].sort(
          (a, b) => a.sequence_number - b.sequence_number,
        );
      });
    } catch (error) {
      if (processingStarted) {
        await this.referenceRepository
          .updateSessionQuestionGenerationStatus({
            sessionId: dto.ai_interview_session_id,
            status: QuestionGenerationStatus.FAILED,
            actorUserId,
          })
          .catch(() => undefined);
      }

      throw error;
    }
  }

  private toEntityPayload(
    question: GeneratedInterviewPlanQuestion,
    sessionId: string,
    actorUserId: string,
    isFollowUp: boolean,
    parentQuestionId: string | null,
  ): Partial<AiInterviewQuestionEntity> {
    return {
      ai_interview_session_id: sessionId,
      parent_question_id: parentQuestionId,
      question_text: question.question_text,
      question_type: question.question_type,
      topic: question.topic,
      difficulty_level: question.difficulty_level,
      sequence_number: question.sequence_number,
      is_follow_up: isFollowUp,
      generated_from: question.generated_from,
      expected_answer_keywords: question.expected_answer_keywords ?? null,
      asked_at: null,
      answered_at: null,
      is_answered: false,
      created_by_user_id: actorUserId,
      updated_by_user_id: null,
      deleted_by_user_id: null,
      deleted_at: null,
    };
  }
}
