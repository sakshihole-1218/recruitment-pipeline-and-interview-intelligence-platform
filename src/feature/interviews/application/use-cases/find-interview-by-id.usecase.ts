import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InterviewRepository } from '../../repositories/interview.repository';
import { InterviewPanelMemberRepository } from '../../repositories/interview-panel-member.repository';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../../accessControl/enums/system-role-code.enum';

@Injectable()
export class FindInterviewByIdUseCase {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly panelMemberRepository: InterviewPanelMemberRepository,
  ) {}

  async execute(id: string, actor?: AuthJwtPayload) {
    const roles = actor?.roles ?? [];
    const isInterviewerOnly =
      roles.includes(SystemRoleCode.INTERVIEWER) &&
      !roles.includes(SystemRoleCode.ADMIN) &&
      !roles.includes(SystemRoleCode.RECRUITER) &&
      !roles.includes(SystemRoleCode.HIRING_MANAGER);

    const interview = await this.interviewRepository.findById(id, {
      withRelations: true,
    });

    if (!interview) {
      throw new NotFoundException({
        message: 'Interview not found',
        code: 'INTERVIEW_NOT_FOUND',
      });
    }

    if (isInterviewerOnly && actor?.sub) {
      const membership =
        await this.panelMemberRepository.findByInterviewAndUser(id, actor.sub);

      if (!membership) {
        throw new ForbiddenException({
          message: 'You do not have permission to access this interview',
          code: 'INTERVIEW_ACCESS_DENIED',
        });
      }
    }

    return interview;
  }
}
