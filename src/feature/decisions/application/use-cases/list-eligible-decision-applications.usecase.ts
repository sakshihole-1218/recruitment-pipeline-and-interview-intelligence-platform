import { Injectable } from '@nestjs/common';

import { SystemRoleCode } from '../../../accessControl/enums/system-role-code.enum';
import { ApplicationRepository } from '../../../applications/repositories/application.repository';

@Injectable()
export class ListEligibleDecisionApplicationsUseCase {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(actor: { userId: string; roles: SystemRoleCode[] }) {
    const isHiringManager =
      actor.roles.includes(SystemRoleCode.HIRING_MANAGER) &&
      !actor.roles.includes(SystemRoleCode.ADMIN);

    return this.applicationRepository.listEligibleForDecision({
      assignedHiringManagerUserId: isHiringManager ? actor.userId : undefined,
      limit: 100,
    });
  }
}
