import { Injectable } from '@nestjs/common';

import { CreateApplicationDto } from '../../dto/create-application.dto';
import { ListApplicationsQueryDto } from '../../dto/list-applications.query.dto';
import { RejectApplicationDto } from '../../dto/reject-application.dto';
import { HoldApplicationDto } from '../../dto/hold-application.dto';
import { WithdrawApplicationDto } from '../../dto/withdraw-application.dto';
import { BulkMoveApplicationStageDto } from '../../dto/bulk-move-application-stage.dto';
import { BulkRejectApplicationsDto } from '../../dto/bulk-reject-applications.dto';
import { BulkAssignRecruiterDto } from '../../dto/bulk-assign-recruiter.dto';
import { BulkAssignHiringManagerDto } from '../../dto/bulk-assign-hiring-manager.dto';

import { CreateApplicationUseCase } from '../use-cases/create-application.usecase';
import { FindApplicationByIdUseCase } from '../use-cases/find-application-by-id.usecase';
import { ListApplicationsUseCase } from '../use-cases/list-applications.usecase';
import { RejectApplicationUseCase } from '../use-cases/reject-application.usecase';
import { HoldApplicationUseCase } from '../use-cases/hold-application.usecase';
import { WithdrawApplicationUseCase } from '../use-cases/withdraw-application.usecase';
import { ListApplicationStageHistoryUseCase } from '../use-cases/list-application-stage-history.usecase';
import { BulkMoveApplicationStageUseCase } from '../use-cases/bulk-move-application-stage.use-case';
import { BulkRejectApplicationsUseCase } from '../use-cases/bulk-reject-applications.use-case';
import { BulkAssignRecruiterUseCase } from '../use-cases/bulk-assign-recruiter.use-case';
import { BulkAssignHiringManagerUseCase } from '../use-cases/bulk-assign-hiring-manager.use-case';

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
    private readonly bulkMoveStageUseCase: BulkMoveApplicationStageUseCase,
    private readonly bulkRejectUseCase: BulkRejectApplicationsUseCase,
    private readonly bulkAssignRecruiterUseCase: BulkAssignRecruiterUseCase,
    private readonly bulkAssignHiringManagerUseCase: BulkAssignHiringManagerUseCase,
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

  async bulkMoveStage(dto: BulkMoveApplicationStageDto, actorUserId?: string) {
    return this.bulkMoveStageUseCase.execute(dto, actorUserId);
  }

  async bulkReject(dto: BulkRejectApplicationsDto, actorUserId?: string) {
    return this.bulkRejectUseCase.execute(dto, actorUserId);
  }

  async bulkAssignRecruiter(dto: BulkAssignRecruiterDto, actorUserId?: string) {
    return this.bulkAssignRecruiterUseCase.execute(dto, actorUserId);
  }

  async bulkAssignHiringManager(dto: BulkAssignHiringManagerDto, actorUserId?: string) {
    return this.bulkAssignHiringManagerUseCase.execute(dto, actorUserId);
  }
}
