import { Injectable } from '@nestjs/common';

import { CreateSkillDto } from '../../dto/create-skill.dto';
import { UpdateSkillDto } from '../../dto/update-skill.dto';
import { UpdateSkillStatusDto } from '../../dto/update-skill-status.dto';
import { ListSkillsQueryDto } from '../../dto/list-skills.query.dto';
import { CreateSkillUseCase } from '../use-cases/create-skill.usecase';
import { UpdateSkillUseCase } from '../use-cases/update-skill.usecase';
import { UpdateSkillStatusUseCase } from '../use-cases/update-skill-status.usecase';
import { FindSkillByIdUseCase } from '../use-cases/find-skill-by-id.usecase';
import { ListSkillsUseCase } from '../use-cases/list-skills.usecase';
import { SoftDeleteSkillUseCase } from '../use-cases/soft-delete-skill.usecase';

@Injectable()
export class SkillsService {
  constructor(
    private readonly createUseCase: CreateSkillUseCase,
    private readonly updateUseCase: UpdateSkillUseCase,
    private readonly updateStatusUseCase: UpdateSkillStatusUseCase,
    private readonly findByIdUseCase: FindSkillByIdUseCase,
    private readonly listUseCase: ListSkillsUseCase,
    private readonly softDeleteUseCase: SoftDeleteSkillUseCase,
  ) {}

  async create(dto: CreateSkillDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  async update(id: string, dto: UpdateSkillDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  async updateStatus(
    id: string,
    dto: UpdateSkillStatusDto,
    actorUserId?: string,
  ) {
    return this.updateStatusUseCase.execute(id, dto, actorUserId);
  }

  async findById(id: string) {
    return this.findByIdUseCase.execute(id);
  }

  async list(query: ListSkillsQueryDto) {
    return this.listUseCase.execute(query);
  }

  async softDelete(id: string, actorUserId?: string) {
    return this.softDeleteUseCase.execute(id, actorUserId);
  }
}
