import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { SubmitInterviewerReviewDto } from '../../dto/submit-interviewer-review.dto';
import { InterviewerReviewEntity } from '../../entities/interviewer-review.entity';
import { InterviewerRecommendation } from '../../enums/interviewer-recommendation.enum';
import { InterviewerReviewStatus } from '../../enums/interviewer-review-status.enum';
import { InterviewerReviewsValidationHelper } from '../../helpers/interviewer-reviews-validation.helper';
import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class SubmitInterviewerReviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: InterviewerReviewRepository,
    private readonly validation: InterviewerReviewsValidationHelper,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: SubmitInterviewerReviewDto,
    actor?: AuthJwtPayload,
  ): Promise<InterviewerReviewEntity> {
    const actorUserId = actor?.sub;
    this.validation.ensureActorUserRequired(actorUserId);
    const isInterviewerOnly =
      this.interviewerAccessValidationHelper.isInterviewerOnly(actor);

    return this.dataSource.transaction(async (manager) => {
      const review = await this.repository.findById(id, {
        manager,
        lockForUpdate: true,
      });

      if (!review) {
        throw new NotFoundException({
          message: 'Interviewer review not found',
          code: 'INTERVIEWER_REVIEW_NOT_FOUND',
        });
      }

      this.validation.ensureSubmitAllowed(review);
      this.validation.ensureInterviewerOwnsReview(
        isInterviewerOnly,
        actorUserId,
        review,
      );
      this.validation.ensureSubmissionPayloadComplete(dto);

      review.technical_score = Number(dto.technical_score).toFixed(2);
      review.communication_score = Number(dto.communication_score).toFixed(2);
      review.problem_solving_score = Number(dto.problem_solving_score).toFixed(
        2,
      );
      review.culture_fit_score = Number(dto.culture_fit_score).toFixed(2);
      review.overall_score = this.validation.computeOverallScore({
        technical_score: dto.technical_score,
        communication_score: dto.communication_score,
        problem_solving_score: dto.problem_solving_score,
        culture_fit_score: dto.culture_fit_score,
      });
      review.strengths = this.validation.normalizeOptionalText(dto.strengths);
      review.concerns = this.validation.normalizeOptionalText(dto.concerns);
      review.detailed_review = this.validation.normalizeOptionalText(
        dto.detailed_review,
      );
      review.interviewer_recommendation = dto.interviewer_recommendation;
      review.review_status = InterviewerReviewStatus.SUBMITTED;
      review.reviewed_at = new Date();
      review.updated_by_user_id = actorUserId;

      return this.repository.updateReview(review, { manager });
    });
  }
}
