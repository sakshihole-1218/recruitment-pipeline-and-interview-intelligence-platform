import { Injectable } from '@nestjs/common';

import { CreateApplicationDto } from '../../dto/create-application.dto';
import { ListApplicationsQueryDto } from '../../dto/list-applications.query.dto';
import { RejectApplicationDto } from '../../dto/reject-application.dto';
import { HoldApplicationDto } from '../../dto/hold-application.dto';
import { WithdrawApplicationDto } from '../../dto/withdraw-application.dto';

import { CreateApplicationUseCase } from '../use-cases/create-application.usecase';
import { FindApplicationByIdUseCase } from '../use-cases/find-application-by-id.usecase';
import { ListApplicationsUseCase } from '../use-cases/list-applications.usecase';
import { RejectApplicationUseCase } from '../use-cases/reject-application.usecase';
import { HoldApplicationUseCase } from '../use-cases/hold-application.usecase';
import { WithdrawApplicationUseCase } from '../use-cases/withdraw-application.usecase';
import { ListApplicationStageHistoryUseCase } from '../use-cases/list-application-stage-history.usecase';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly createUseCase: CreateApplicationUseCase,
    private readonly findByIdUseCase: FindApplicationByIdUseCase,
    private readonly listUseCase: ListApplicationsUseCase,
    private readonly rejectUseCase: RejectApplicationUseCase,
    private readonly holdUseCase: HoldApplicationUseCase,
    private readonly withdrawUseCase: WithdrawApplicationUseCase,
    private readonly listStageHistoryUseCase: ListApplicationStageHistoryUseCase,
  ) {}

  async create(dto: CreateApplicationDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  async findById(id: string) {
    return this.findByIdUseCase.execute(id);
  }

  async list(query: ListApplicationsQueryDto) {
    return this.listUseCase.execute(query);
  }

  async reject(id: string, dto: RejectApplicationDto, actorUserId?: string) {
    return this.rejectUseCase.execute(id, dto, actorUserId);
  }

  async hold(id: string, dto: HoldApplicationDto, actorUserId?: string) {
    return this.holdUseCase.execute(id, dto, actorUserId);
  }

  async withdraw(id: string, dto: WithdrawApplicationDto, actorUserId?: string) {
    return this.withdrawUseCase.execute(id, dto, actorUserId);
  }

  async listStageHistory(id: string) {
    return this.listStageHistoryUseCase.execute(id);
  }
}
