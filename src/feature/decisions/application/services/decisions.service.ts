import { Injectable } from '@nestjs/common';

import { CreateApplicationDecisionDto } from '../../dto/create-application-decision.dto';
import { UpdateApplicationDecisionDto } from '../../dto/update-application-decision.dto';
import { ListDecisionsQueryDto } from '../../dto/list-decisions.query.dto';
import { CreateApplicationDecisionUseCase } from '../use-cases/create-application-decision.usecase';
import { UpdateApplicationDecisionUseCase } from '../use-cases/update-application-decision.usecase';
import { FindDecisionByIdUseCase } from '../use-cases/find-decision-by-id.usecase';
import { FindDecisionByApplicationIdUseCase } from '../use-cases/find-decision-by-application-id.usecase';
import { ListDecisionsUseCase } from '../use-cases/list-decisions.usecase';
import { SoftDeleteDecisionUseCase } from '../use-cases/soft-delete-decision.usecase';

@Injectable()
export class DecisionsService {
  constructor(
    private readonly createUseCase: CreateApplicationDecisionUseCase,
    private readonly updateUseCase: UpdateApplicationDecisionUseCase,
    private readonly findByIdUseCase: FindDecisionByIdUseCase,
    private readonly findByApplicationIdUseCase: FindDecisionByApplicationIdUseCase,
    private readonly listUseCase: ListDecisionsUseCase,
    private readonly softDeleteUseCase: SoftDeleteDecisionUseCase,
  ) {}

  async create(dto: CreateApplicationDecisionDto, actorUserId: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  async update(id: string, dto: UpdateApplicationDecisionDto, actorUserId: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  async findById(id: string) {
    return this.findByIdUseCase.execute(id);
  }

  async findByApplicationId(applicationId: string) {
    return this.findByApplicationIdUseCase.execute(applicationId);
  }

  async list(query: ListDecisionsQueryDto) {
    return this.listUseCase.execute(query);
  }

  async softDelete(id: string, actorUserId: string) {
    return this.softDeleteUseCase.execute(id, actorUserId);
  }
}
