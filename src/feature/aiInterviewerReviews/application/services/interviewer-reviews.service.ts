import { Injectable } from '@nestjs/common';

import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
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

  create(dto: CreateInterviewerReviewDto, actor?: AuthJwtPayload) {
    return this.createUseCase.execute(dto, actor);
  }

  update(id: string, dto: UpdateInterviewerReviewDto, actor?: AuthJwtPayload) {
    return this.updateUseCase.execute(id, dto, actor);
  }

  submit(id: string, dto: SubmitInterviewerReviewDto, actor?: AuthJwtPayload) {
    return this.submitUseCase.execute(id, dto, actor);
  }

  getById(id: string, actor?: AuthJwtPayload) {
    return this.getByIdUseCase.execute(id, actor);
  }

  getBySession(sessionId: string, actor?: AuthJwtPayload) {
    return this.getBySessionUseCase.execute(sessionId, actor);
  }

  getByApplication(applicationId: string, actor?: AuthJwtPayload) {
    return this.getByApplicationUseCase.execute(applicationId, actor);
  }

  list(query: InterviewerReviewQueryDto, actor?: AuthJwtPayload) {
    return this.listUseCase.execute(query, actor);
  }

  softDelete(id: string, actorUserId?: string) {
    return this.deleteUseCase.execute(id, actorUserId);
  }
}
