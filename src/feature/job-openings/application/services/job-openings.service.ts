import { Injectable } from '@nestjs/common';

import { CreateJobOpeningDto } from '../../dto/create-job-opening.dto';
import { UpdateJobOpeningDto } from '../../dto/update-job-opening.dto';
import { ListJobOpeningsQueryDto } from '../../dto/list-job-openings.query.dto';
import { ReplaceJobOpeningSkillsDto } from '../../dto/replace-job-opening-skills.dto';
import { CreateJobOpeningUseCase } from '../use-cases/create-job-opening.usecase';
import { UpdateJobOpeningUseCase } from '../use-cases/update-job-opening.usecase';
import { FindJobOpeningByIdUseCase } from '../use-cases/find-job-opening-by-id.usecase';
import { ListJobOpeningsUseCase } from '../use-cases/list-job-openings.usecase';
import { PublishJobOpeningUseCase } from '../use-cases/publish-job-opening.usecase';
import { UnpublishJobOpeningUseCase } from '../use-cases/unpublish-job-opening.usecase';
import { OpenJobOpeningUseCase } from '../use-cases/open-job-opening.usecase';
import { CloseJobOpeningUseCase } from '../use-cases/close-job-opening.usecase';
import { SoftDeleteJobOpeningUseCase } from '../use-cases/soft-delete-job-opening.usecase';
import { ReplaceJobOpeningSkillsUseCase } from '../use-cases/replace-job-opening-skills.usecase';

@Injectable()
export class JobOpeningsService {
  constructor(
    private readonly createUseCase: CreateJobOpeningUseCase,
    private readonly updateUseCase: UpdateJobOpeningUseCase,
    private readonly findByIdUseCase: FindJobOpeningByIdUseCase,
    private readonly listUseCase: ListJobOpeningsUseCase,
    private readonly publishUseCase: PublishJobOpeningUseCase,
    private readonly unpublishUseCase: UnpublishJobOpeningUseCase,
    private readonly openUseCase: OpenJobOpeningUseCase,
    private readonly closeUseCase: CloseJobOpeningUseCase,
    private readonly softDeleteUseCase: SoftDeleteJobOpeningUseCase,
    private readonly replaceSkillsUseCase: ReplaceJobOpeningSkillsUseCase,
  ) {}

  async create(dto: CreateJobOpeningDto, actorUserId?: string) {
    return this.createUseCase.execute(dto, actorUserId);
  }

  async update(id: string, dto: UpdateJobOpeningDto, actorUserId?: string) {
    return this.updateUseCase.execute(id, dto, actorUserId);
  }

  async findById(id: string) {
    return this.findByIdUseCase.execute(id);
  }

  async list(query: ListJobOpeningsQueryDto) {
    return this.listUseCase.execute(query);
  }

  async publish(id: string, actorUserId?: string) {
    return this.publishUseCase.execute(id, actorUserId);
  }

  async unpublish(id: string, actorUserId?: string) {
    return this.unpublishUseCase.execute(id, actorUserId);
  }

  async open(id: string, actorUserId?: string) {
    return this.openUseCase.execute(id, actorUserId);
  }

  async close(id: string, actorUserId?: string) {
    return this.closeUseCase.execute(id, actorUserId);
  }

  async softDelete(id: string, actorUserId?: string) {
    return this.softDeleteUseCase.execute(id, actorUserId);
  }

  async replaceSkills(
    id: string,
    dto: ReplaceJobOpeningSkillsDto,
    actorUserId?: string,
  ) {
    return this.replaceSkillsUseCase.execute(id, dto.skills, actorUserId);
  }
}
