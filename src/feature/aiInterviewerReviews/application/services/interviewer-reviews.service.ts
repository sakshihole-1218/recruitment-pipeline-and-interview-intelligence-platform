import { Injectable } from '@nestjs/common';

import { CreateInterviewerReviewDto } from '../../dto/create-interviewer-review.dto';
import { InterviewerReviewQueryDto } from '../../dto/interviewer-review.query.dto';
import { SubmitInterviewerReviewDto } from '../../dto/submit-interviewer-review.dto';
import { UpdateInterviewerReviewDto } from '../../dto/update-interviewer-review.dto';
import { CreateInterviewerReviewUseCase } from '../use-cases/create-interviewer-review.usecase';
import { DeleteInterviewerReviewUseCase } from '../use-cases/delete-interviewer-review.usecase';
import { GetInterviewerReviewByIdUseCase } from '../use-cases/get-interviewer-review-by-id.usecase';
import { GetReviewsByApplicationUseCase } from '../use-cases/get-reviews-by-application.usecase';
import { GetReviewsBySessionUseCase } from '../use-cases/get-reviews-by-session.usecase';
import { ListInterviewerReviewsUseCase } from '../use-cases/list-interviewer-reviews.usecase';
import { SubmitInterviewerReviewUseCase } from '../use-cases/submit-interviewer-review.usecase';
import { UpdateInterviewerReviewUseCase } from '../use-cases/update-interviewer-review.usecase';

@Injectable()
export class InterviewerReviewsService {
  constructor(
    private readonly createUseCase: CreateInterviewerReviewUseCase,
    private readonly updateUseCase: UpdateInterviewerReviewUseCase,
    private readonly submitUseCase: SubmitInterviewerReviewUseCase,
    private readonly getByIdUseCase: GetInterviewerReviewByIdUseCase,
    private readonly getBySessionUseCase: GetReviewsBySessionUseCase,
    private readonly getByApplicationUseCase: GetReviewsByApplicationUseCase,
    private readonly listUseCase: ListInterviewerReviewsUseCase,
    private readonly deleteUseCase: DeleteInterviewerReviewUseCase,
  ) {}

  create(dto: CreateInterviewerReviewDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  update(id: string, dto: UpdateInterviewerReviewDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  submit(id: string, dto: SubmitInterviewerReviewDto, actorUserId?: string) {
    return this.submitUseCase.execute(id, dto, actorUserId);
  }

  getById(id: string) {
    return this.getByIdUseCase.execute(id);
  }

  getBySession(sessionId: string) {
    return this.getBySessionUseCase.execute(sessionId);
  }

  getByApplication(applicationId: string) {
    return this.getByApplicationUseCase.execute(applicationId);
  }

  list(query: InterviewerReviewQueryDto) {
    return this.listUseCase.execute(query);
  }

  softDelete(id: string, actorUserId?: string) {
    return this.deleteUseCase.execute(id, actorUserId);
  }
}
