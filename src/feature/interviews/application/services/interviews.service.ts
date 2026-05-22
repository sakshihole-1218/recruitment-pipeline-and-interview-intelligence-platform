import { Injectable } from '@nestjs/common';

import { CreateInterviewRoundDto } from '../../dto/create-interview-round.dto';
import { UpdateInterviewRoundDto } from '../../dto/update-interview-round.dto';
import { GetInterviewRoundsByJobOpeningQueryDto } from '../../dto/get-interview-rounds-by-job-opening.query.dto';
import { ScheduleInterviewDto } from '../../dto/schedule-interview.dto';
import { RescheduleInterviewDto } from '../../dto/reschedule-interview.dto';
import { CancelInterviewDto } from '../../dto/cancel-interview.dto';
import { CompleteInterviewDto } from '../../dto/complete-interview.dto';
import { AssignInterviewPanelMembersDto } from '../../dto/assign-interview-panel-members.dto';
import { SubmitInterviewFeedbackDto } from '../../dto/submit-interview-feedback.dto';
import { ListInterviewsQueryDto } from '../../dto/list-interviews.query.dto';
import { ListInterviewFeedbackQueryDto } from '../../dto/list-interview-feedback.query.dto';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { CreateInterviewRoundUseCase } from '../../application/use-cases/create-interview-round.usecase';
import { UpdateInterviewRoundUseCase } from '../../application/use-cases/update-interview-round.usecase';
import { ListInterviewRoundsByJobOpeningUseCase } from '../../application/use-cases/list-interview-rounds-by-job-opening.usecase';
import { ScheduleInterviewUseCase } from '../../application/use-cases/schedule-interview.usecase';
import { RescheduleInterviewUseCase } from '../../application/use-cases/reschedule-interview.usecase';
import { CancelInterviewUseCase } from '../../application/use-cases/cancel-interview.usecase';
import { CompleteInterviewUseCase } from '../../application/use-cases/complete-interview.usecase';
import { ReplaceInterviewPanelMembersUseCase } from '../../application/use-cases/replace-interview-panel-members.usecase';
import { FindInterviewByIdUseCase } from '../../application/use-cases/find-interview-by-id.usecase';
import { ListInterviewsUseCase } from '../../application/use-cases/list-interviews.usecase';
import { SubmitInterviewFeedbackUseCase } from '../../application/use-cases/submit-interview-feedback.usecase';
import { ListInterviewFeedbackByInterviewUseCase } from '../../application/use-cases/list-interview-feedback-by-interview.usecase';
import { ListInterviewFeedbackByApplicationUseCase } from '../../application/use-cases/list-interview-feedback-by-application.usecase';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly createInterviewRoundUseCase: CreateInterviewRoundUseCase,
    private readonly updateInterviewRoundUseCase: UpdateInterviewRoundUseCase,
    private readonly listRoundsByJobOpeningUseCase: ListInterviewRoundsByJobOpeningUseCase,
    private readonly scheduleInterviewUseCase: ScheduleInterviewUseCase,
    private readonly rescheduleInterviewUseCase: RescheduleInterviewUseCase,
    private readonly cancelInterviewUseCase: CancelInterviewUseCase,
    private readonly completeInterviewUseCase: CompleteInterviewUseCase,
    private readonly replacePanelMembersUseCase: ReplaceInterviewPanelMembersUseCase,
    private readonly findInterviewByIdUseCase: FindInterviewByIdUseCase,
    private readonly listInterviewsUseCase: ListInterviewsUseCase,
    private readonly submitFeedbackUseCase: SubmitInterviewFeedbackUseCase,
    private readonly listFeedbackByInterviewUseCase: ListInterviewFeedbackByInterviewUseCase,
    private readonly listFeedbackByApplicationUseCase: ListInterviewFeedbackByApplicationUseCase,
  ) {}

  async createInterviewRound(dto: CreateInterviewRoundDto, actorUserId?: string) {
    return this.createInterviewRoundUseCase.execute(dto, actorUserId);
  }

  async updateInterviewRound(id: string, dto: UpdateInterviewRoundDto, actorUserId?: string) {
    return this.updateInterviewRoundUseCase.execute(id, dto, actorUserId);
  }

  async getInterviewRoundsByJobOpening(query: GetInterviewRoundsByJobOpeningQueryDto) {
    return this.listRoundsByJobOpeningUseCase.execute(query.job_opening_id);
  }

  async scheduleInterview(dto: ScheduleInterviewDto, actorUserId: string) {
    return this.scheduleInterviewUseCase.execute(dto, actorUserId);
  }

  async rescheduleInterview(id: string, dto: RescheduleInterviewDto, actorUserId: string) {
    return this.rescheduleInterviewUseCase.execute(id, dto, actorUserId);
  }

  async cancelInterview(id: string, dto: CancelInterviewDto, actorUserId: string) {
    return this.cancelInterviewUseCase.execute(id, dto, actorUserId);
  }

  async completeInterview(id: string, dto: CompleteInterviewDto, actorUserId: string) {
    return this.completeInterviewUseCase.execute(id, dto, actorUserId);
  }

  async assignPanelMembers(id: string, dto: AssignInterviewPanelMembersDto, actorUserId: string) {
    return this.replacePanelMembersUseCase.execute(id, dto, actorUserId);
  }

  async findInterviewById(id: string, actor?: AuthJwtPayload) {
    return this.findInterviewByIdUseCase.execute(id, actor);
  }

  async listInterviews(query: ListInterviewsQueryDto, actor?: AuthJwtPayload) {
    return this.listInterviewsUseCase.execute(query, actor);
  }

  async submitFeedback(interviewId: string, dto: SubmitInterviewFeedbackDto, actorUserId: string) {
    return this.submitFeedbackUseCase.execute(interviewId, dto, actorUserId);
  }

  async listFeedbackByInterview(
    interviewId: string,
    query: ListInterviewFeedbackQueryDto,
    actor?: AuthJwtPayload,
  ) {
    return this.listFeedbackByInterviewUseCase.execute(interviewId, query, actor);
  }

  async listFeedbackByApplication(
    applicationId: string,
    query: ListInterviewFeedbackQueryDto,
    actor?: AuthJwtPayload,
  ) {
    return this.listFeedbackByApplicationUseCase.execute(applicationId, query, actor);
  }
}
