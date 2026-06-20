import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateInterviewerReviewDto } from '../../dto/update-interviewer-review.dto';
import { InterviewerReviewEntity } from '../../entities/interviewer-review.entity';
import { InterviewerReviewsValidationHelper } from '../../helpers/interviewer-reviews-validation.helper';
import { InterviewerReviewRepository } from '../../repositories/interviewer-review.repository';

@Injectable()
export class UpdateInterviewerReviewUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: InterviewerReviewRepository,
    private readonly validation: InterviewerReviewsValidationHelper,
  ) {}

  async execute(
    id: string,
    dto: UpdateInterviewerReviewDto,
    actorUserId?: string,
  ): Promise<InterviewerReviewEntity> {
    this.validation.ensureActorUserRequired(actorUserId);
    this.validation.ensureUpdateDoesNotSubmit(dto.review_status);

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

      this.validation.ensureDraftEditable(review);

      if (dto.technical_score !== undefined) {
        review.technical_score =
          dto.technical_score === null
            ? null
            : Number(dto.technical_score).toFixed(2);
      }

      if (dto.communication_score !== undefined) {
        review.communication_score =
          dto.communication_score === null
            ? null
            : Number(dto.communication_score).toFixed(2);
      }

      if (dto.problem_solving_score !== undefined) {
        review.problem_solving_score =
          dto.problem_solving_score === null
            ? null
            : Number(dto.problem_solving_score).toFixed(2);
      }

      if (dto.culture_fit_score !== undefined) {
        review.culture_fit_score =
          dto.culture_fit_score === null
            ? null
            : Number(dto.culture_fit_score).toFixed(2);
      }

      if (dto.strengths !== undefined) {
        review.strengths = this.validation.normalizeOptionalText(dto.strengths);
      }

      if (dto.concerns !== undefined) {
        review.concerns = this.validation.normalizeOptionalText(dto.concerns);
      }

      if (dto.detailed_review !== undefined) {
        review.detailed_review = this.validation.normalizeOptionalText(
          dto.detailed_review,
        );
      }

      if (dto.interviewer_recommendation !== undefined) {
        review.interviewer_recommendation =
          dto.interviewer_recommendation ?? null;
      }

      if (dto.review_status !== undefined) {
        review.review_status = dto.review_status;
      }

      review.overall_score = this.validation.computeOverallScore({
        technical_score: review.technical_score,
        communication_score: review.communication_score,
        problem_solving_score: review.problem_solving_score,
        culture_fit_score: review.culture_fit_score,
      });
      review.updated_by_user_id = actorUserId;

      return this.repository.updateReview(review, { manager });
    });
  }
}
