import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { SubmitInterviewFeedbackDto } from '../../dto/submit-interview-feedback.dto';
import { InterviewFeedbackEntity } from '../../entities/interview-feedback.entity';
import { InterviewStatus } from '../../enums/interview-status.enum';
import { InterviewsValidationHelper } from '../../helpers/interviews-validation.helper';
import { InterviewFeedbackRepository } from '../../repositories/interview-feedback.repository';
import { InterviewPanelMemberRepository } from '../../repositories/interview-panel-member.repository';
import { InterviewRepository } from '../../repositories/interview.repository';

@Injectable()
export class SubmitInterviewFeedbackUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly interviewRepository: InterviewRepository,
    private readonly panelMemberRepository: InterviewPanelMemberRepository,
    private readonly feedbackRepository: InterviewFeedbackRepository,
    private readonly validationHelper: InterviewsValidationHelper,
  ) {}

  async execute(
    interviewId: string,
    dto: SubmitInterviewFeedbackDto,
    actorUserId: string,
  ): Promise<InterviewFeedbackEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const interview = await this.interviewRepository.findById(interviewId, {
        manager,
      });

      if (!interview) {
        throw new NotFoundException({
          message: 'Interview not found',
          code: 'INTERVIEW_NOT_FOUND',
        });
      }

      if (interview.interview_status !== InterviewStatus.COMPLETED) {
        throw new ConflictException({
          message: 'Feedback can only be submitted for completed interviews',
          code: 'INTERVIEW_FEEDBACK_INVALID_STATUS',
        });
      }

      const isPanelMember = await this.panelMemberRepository.findByInterviewAndUser(
        interviewId,
        actorUserId,
        { manager },
      );

      if (!isPanelMember) {
        throw new ForbiddenException({
          message: 'Only assigned panel members can submit feedback',
          code: 'INTERVIEWER_NOT_IN_PANEL',
        });
      }

      const existing = await this.feedbackRepository.findByInterviewAndInterviewer(
        interviewId,
        actorUserId,
        { includeDeleted: true, manager },
      );

      if (existing && !existing.deleted_at) {
        throw new ConflictException({
          message: 'Feedback already submitted for this interview',
          code: 'INTERVIEW_FEEDBACK_ALREADY_SUBMITTED',
        });
      }

      const now = new Date();
      const overall = this.validationHelper.computeOverallScore(dto);

      if (existing && existing.deleted_at) {
        existing.deleted_at = null;
        existing.deleted_by_user_id = null;
        existing.updated_by_user_id = actorUserId;
        existing.technical_score = dto.technical_score;
        existing.communication_score = dto.communication_score;
        existing.problem_solving_score = dto.problem_solving_score;
        existing.culture_fit_score = dto.culture_fit_score;
        existing.overall_score = overall;
        existing.strengths = dto.strengths?.trim() || null;
        existing.concerns = dto.concerns?.trim() || null;
        existing.detailed_feedback = dto.detailed_feedback?.trim() || null;
        existing.recommendation = dto.recommendation;
        existing.submitted_at = now;

        await this.feedbackRepository.save(existing, { manager });
        const loaded = await this.feedbackRepository.findByInterviewAndInterviewer(
          interviewId,
          actorUserId,
          { manager },
        );

        if (!loaded) {
          throw new ConflictException({
            message: 'We could not complete the request. Please try again',
            code: 'INTERVIEW_FEEDBACK_POST_SUBMIT_LOAD_FAILED',
          });
        }

        return loaded;
      }

      const created = await this.feedbackRepository.createAndSave(
        {
          interview_id: interviewId,
          interviewer_user_id: actorUserId,
          technical_score: dto.technical_score,
          communication_score: dto.communication_score,
          problem_solving_score: dto.problem_solving_score,
          culture_fit_score: dto.culture_fit_score,
          overall_score: overall,
          strengths: dto.strengths?.trim() || null,
          concerns: dto.concerns?.trim() || null,
          detailed_feedback: dto.detailed_feedback?.trim() || null,
          recommendation: dto.recommendation,
          submitted_at: now,
          created_by_user_id: actorUserId,
          updated_by_user_id: null,
          deleted_by_user_id: null,
          deleted_at: null,
        },
        { manager },
      );

      const loaded = await this.feedbackRepository.findByInterviewAndInterviewer(
        interviewId,
        actorUserId,
        { manager },
      );

      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'INTERVIEW_FEEDBACK_POST_SUBMIT_LOAD_FAILED',
        });
      }

      return loaded;
    });
  }
}
