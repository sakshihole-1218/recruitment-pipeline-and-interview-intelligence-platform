import { Injectable } from '@nestjs/common';

import { ListInterviewsQueryDto } from '../../dto/list-interviews.query.dto';
import { InterviewsPaginationHelper } from '../../helpers/interviews-pagination.helper';
import { InterviewRepository } from '../../repositories/interview.repository';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../../accessControl/enums/system-role-code.enum';

@Injectable()
export class ListInterviewsUseCase {
  constructor(
    private readonly paginationHelper: InterviewsPaginationHelper,
    private readonly interviewRepository: InterviewRepository,
  ) {}

  async execute(query: ListInterviewsQueryDto, actor?: AuthJwtPayload) {
    const roles = actor?.roles ?? [];
    const isInterviewerOnly =
      roles.includes(SystemRoleCode.INTERVIEWER) &&
      !roles.includes(SystemRoleCode.ADMIN) &&
      !roles.includes(SystemRoleCode.RECRUITER) &&
      !roles.includes(SystemRoleCode.HIRING_MANAGER);

    const effectiveQuery: ListInterviewsQueryDto = isInterviewerOnly
      ? {
          ...query,
          interviewer_user_id: actor?.sub,
        }
      : query;

    this.paginationHelper.ensureCursorCompatibleSort({
      cursor: effectiveQuery.cursor,
      sort_by: effectiveQuery.sort_by,
    });

    return this.interviewRepository.list(effectiveQuery);
  }
}
