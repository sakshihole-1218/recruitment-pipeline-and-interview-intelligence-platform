import { BadRequestException, Injectable } from '@nestjs/common';

import { AiInterviewFeedbackService } from '../../../aiInterviewFeedback/application/services/ai-interview-feedback.service';
import { AiInterviewQuestionsService } from '../../../aiInterviewQuestions/application/services/ai-interview-questions.service';
import { AiInterviewSessionsService } from '../../../aiInterviewSessions/application/services/ai-interview-sessions.service';
import { AiInterviewTranscriptsService } from '../../../aiInterviewTranscripts/application/services/ai-interview-transcripts.service';
import { GenerateInterviewPlanDto } from '../../../aiInterviewQuestions/dto/generate-interview-plan.dto';
import { CandidateCreateTranscriptEntryDto } from '../../dto/candidate-create-transcript-entry.dto';
import { CandidateTranscribeAnswerDto } from '../../dto/candidate-transcribe-answer.dto';
import { CreateCandidateInterviewInviteUseCase } from '../use-cases/create-candidate-interview-invite.usecase';
import { ValidateCandidateInterviewInviteUseCase } from '../use-cases/validate-candidate-interview-invite.usecase';
import { MarkCandidateInterviewInviteAccessedUseCase } from '../use-cases/mark-candidate-interview-invite-accessed.usecase';
import { CompleteCandidateInterviewInviteUseCase } from '../use-cases/complete-candidate-interview-invite.usecase';
import { RevokeCandidateInterviewInviteUseCase } from '../use-cases/revoke-candidate-interview-invite.usecase';
import { RegenerateCandidateInterviewInviteUseCase } from '../use-cases/regenerate-candidate-interview-invite.usecase';
import { CandidateInterviewInviteRepository } from '../../repositories/candidate-interview-invite.repository';

@Injectable()
export class CandidateInterviewInvitesService {
  constructor(
    private readonly createUseCase: CreateCandidateInterviewInviteUseCase,
    private readonly validateUseCase: ValidateCandidateInterviewInviteUseCase,
    private readonly markAccessedUseCase: MarkCandidateInterviewInviteAccessedUseCase,
    private readonly completeUseCase: CompleteCandidateInterviewInviteUseCase,
    private readonly revokeUseCase: RevokeCandidateInterviewInviteUseCase,
    private readonly regenerateUseCase: RegenerateCandidateInterviewInviteUseCase,
    private readonly repository: CandidateInterviewInviteRepository,
    private readonly aiSessionsService: AiInterviewSessionsService,
    private readonly aiQuestionsService: AiInterviewQuestionsService,
    private readonly aiTranscriptsService: AiInterviewTranscriptsService,
    private readonly aiFeedbackService: AiInterviewFeedbackService,
  ) {}

  create(interviewId: string, actorUserId?: string) {
    return this.createUseCase.execute(interviewId, actorUserId);
  }

  validate(token: string) {
    return this.validateUseCase.execute(token);
  }

  markAccessedByToken(token: string) {
    return this.validate(token).then((invite) => this.markAccessedUseCase.execute(invite));
  }

  completeByToken(token: string) {
    return this.validate(token).then((invite) => this.completeUseCase.execute(invite));
  }

  revoke(id: string, actorUserId?: string) {
    return this.revokeUseCase.execute(id, actorUserId);
  }

  regenerate(id: string, actorUserId?: string) {
    return this.regenerateUseCase.execute(id, actorUserId);
  }

  getByInterviewId(interviewId: string) {
    return this.repository.findLatestByInterviewId(interviewId);
  }

  async startCandidateInterview(token: string) {
    const invite = await this.validate(token);
    await this.markAccessedUseCase.execute(invite);

    let session = invite.ai_interview_session!;
    if (session.session_status === 'READY') {
      session = await this.aiSessionsService.start(session.id);
    }

    if (session.question_generation_status !== 'COMPLETED') {
      await this.aiQuestionsService.generatePlan(
        { ai_interview_session_id: session.id } as GenerateInterviewPlanDto,
      );
    }

    return this.repository.findById(invite.id);
  }

  async completeCandidateInterview(token: string) {
    const invite = await this.validate(token);
    const session = await this.aiSessionsService.end(invite.ai_interview_session_id);
    const completedInvite = await this.completeUseCase.execute(invite);

    if (session.feedback_generation_status !== 'COMPLETED') {
      try {
        await this.aiFeedbackService.generate(session.id);
      } catch {
        // Leave feedback generation failure to existing workflow/status handling.
      }
    }

    return completedInvite;
  }

  async getQuestions(token: string) {
    const invite = await this.validate(token);
    await this.markAccessedUseCase.execute(invite);
    return this.aiQuestionsService.getBySession(invite.ai_interview_session_id);
  }

  async generateFollowUp(token: string, questionId: string) {
    const invite = await this.validate(token);
    await this.assertQuestionBelongsToInviteSession(
      invite.ai_interview_session_id,
      questionId,
    );
    return this.aiQuestionsService.generateFollowUp(questionId);
  }

  async markQuestionAsked(token: string, questionId: string) {
    const invite = await this.validate(token);
    await this.assertQuestionBelongsToInviteSession(
      invite.ai_interview_session_id,
      questionId,
    );
    return this.aiQuestionsService.markAsked(questionId);
  }

  async markQuestionAnswered(token: string, questionId: string) {
    const invite = await this.validate(token);
    await this.assertQuestionBelongsToInviteSession(
      invite.ai_interview_session_id,
      questionId,
    );
    return this.aiQuestionsService.markAnswered(questionId);
  }

  async getTranscripts(token: string) {
    const invite = await this.validate(token);
    await this.markAccessedUseCase.execute(invite);
    return this.aiTranscriptsService.getBySession(invite.ai_interview_session_id);
  }

  async createTranscript(token: string, dto: CandidateCreateTranscriptEntryDto) {
    const invite = await this.validate(token);
    if (dto.ai_interview_question_id) {
      await this.assertQuestionBelongsToInviteSession(
        invite.ai_interview_session_id,
        dto.ai_interview_question_id,
      );
    }
    return this.aiTranscriptsService.create({
      ...dto,
      ai_interview_session_id: invite.ai_interview_session_id,
    });
  }

  async transcribeAnswer(
    token: string,
    dto: CandidateTranscribeAnswerDto,
    file: Express.Multer.File | undefined,
  ) {
    const invite = await this.validate(token);
    await this.assertQuestionBelongsToInviteSession(
      invite.ai_interview_session_id,
      dto.ai_interview_question_id,
    );
    return this.aiTranscriptsService.transcribeAnswer(
      {
        ...dto,
        ai_interview_session_id: invite.ai_interview_session_id,
      },
      file,
    );
  }

  private async assertQuestionBelongsToInviteSession(
    sessionId: string,
    questionId: string,
  ) {
    const question = await this.aiQuestionsService.getById(questionId);
    if (question.ai_interview_session_id !== sessionId) {
      throw new BadRequestException({
        message: 'Question does not belong to the current interview session',
        code: 'CANDIDATE_INTERVIEW_QUESTION_SESSION_MISMATCH',
      });
    }
  }
}
