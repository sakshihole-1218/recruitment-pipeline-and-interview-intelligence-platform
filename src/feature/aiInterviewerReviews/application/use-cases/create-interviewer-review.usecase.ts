import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateInterviewerReviewDto } from '../../dto/create-interviewer-review.dto';
import { InterviewerReviewEntity } from '../../entities/interviewer-review.entity';
import { InterviewerReviewStatus } from '../../enums/interviewer-review-status.enum';
import { InterviewerReviewsValidationHelper } from '../../helpers/interviewer-reviews-validation.helper';
import { InterviewerReviewReferenceRepository } from '../../repositories/interviewer-review-reference.repository';
import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class CreateInterviewerReviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: InterviewerReviewRepository,
    private readonly referenceRepository: InterviewerReviewReferenceRepository,
    private readonly validation: InterviewerReviewsValidationHelper,
  ) {}

  async execute(
    dto: CreateInterviewerReviewDto,
    actorUserId?: string,
  ): Promise<InterviewerReviewEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

    return this.dataSource.transaction(async (manager) => {
      const session = await this.referenceRepository.findSessionById(
        dto.ai_interview_session_id,
        manager,
      );

      if (!session) {
        throw new NotFoundException({
          message: 'AI interview session not found',
          code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
        });
      }

      this.validation.ensureSessionCompleted(session.session_status);

      const reviewer = await this.referenceRepository.findActiveUserById(
        dto.reviewer_user_id,
        manager,
      );

      if (!reviewer) {
        throw new NotFoundException({
          message: 'Reviewer user not found',
          code: 'REVIEWER_USER_NOT_FOUND',
        });
      }

      const panelMembers =
        await this.referenceRepository.listPanelMembersByInterviewId(
          session.interview_id,
          manager,
        );
      this.validation.ensureReviewerAllowed(panelMembers, dto.reviewer_user_id);

      if (dto.review_status === InterviewerReviewStatus.SUBMITTED) {
        throw new ConflictException({
          message: 'Use the submit endpoint to submit an interviewer review',
          code: 'INTERVIEWER_REVIEW_USE_SUBMIT_ENDPOINT',
        });
      }

      const duplicateExists =
        await this.repository.existsActiveReviewByReviewerForSession(
          dto.reviewer_user_id,
          dto.ai_interview_session_id,
          { manager },
        );

      if (duplicateExists) {
        throw new ConflictException({
          message:
            'An active interviewer review already exists for this reviewer and AI interview session',
          code: 'INTERVIEWER_REVIEW_DUPLICATE_ACTIVE',
        });
      }

      let feedbackId: string | null = null;
      if (dto.ai_interview_feedback_id) {
        const feedback = await this.referenceRepository.findFeedbackById(
          dto.ai_interview_feedback_id,
          manager,
        );

        if (!feedback) {
          throw new NotFoundException({
            message: 'AI interview feedback not found',
            code: 'AI_INTERVIEW_FEEDBACK_NOT_FOUND',
          });
        }

        this.validation.ensureFeedbackBelongsToSession(
          feedback,
          dto.ai_interview_session_id,
        );
        feedbackId = feedback.id;
      }

      const application = await this.referenceRepository.findApplicationById(
        session.application_id,
        manager,
      );

      if (!application) {
        throw new NotFoundException({
          message: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      const overallScore = this.validation.computeOverallScore({
        technical_score: dto.technical_score,
        communication_score: dto.communication_score,
        problem_solving_score: dto.problem_solving_score,
        culture_fit_score: dto.culture_fit_score,
      });

      try {
        const created = await this.repository.createReview(
          {
            ai_interview_session_id: session.id,
            ai_interview_feedback_id: feedbackId,
            application_id: session.application_id,
            candidate_id: session.candidate_id,
            reviewer_user_id: dto.reviewer_user_id,
            technical_score:
              dto.technical_score === undefined || dto.technical_score === null
                ? null
                : Number(dto.technical_score).toFixed(2),
            communication_score:
              dto.communication_score === undefined ||
              dto.communication_score === null
                ? null
                : Number(dto.communication_score).toFixed(2),
            problem_solving_score:
              dto.problem_solving_score === undefined ||
              dto.problem_solving_score === null
                ? null
                : Number(dto.problem_solving_score).toFixed(2),
            culture_fit_score:
              dto.culture_fit_score === undefined ||
              dto.culture_fit_score === null
                ? null
                : Number(dto.culture_fit_score).toFixed(2),
            overall_score: overallScore,
            strengths: this.validation.normalizeOptionalText(dto.strengths),
            concerns: this.validation.normalizeOptionalText(dto.concerns),
            detailed_review: this.validation.normalizeOptionalText(
              dto.detailed_review,
            ),
            interviewer_recommendation: dto.interviewer_recommendation ?? null,
            review_status: dto.review_status ?? InterviewerReviewStatus.DRAFT,
            reviewed_at: null,
            created_by_user_id: actorUserId,
            updated_by_user_id: null,
            deleted_by_user_id: null,
            deleted_at: null,
          },
          { manager },
        );

        const loaded = await this.repository.findById(created.id, { manager });
        if (!loaded) {
          throw new ConflictException({
            message: 'We could not complete the request. Please try again',
            code: 'INTERVIEWER_REVIEW_POST_CREATE_LOAD_FAILED',
          });
        }

        return loaded;
      } catch (error: any) {
        if (String(error?.code) === '23505') {
          throw new ConflictException({
            message:
              'An active interviewer review already exists for this reviewer and AI interview session',
            code: 'INTERVIEWER_REVIEW_DUPLICATE_ACTIVE',
          });
        }
        throw error;
      }
    });
  }
}
