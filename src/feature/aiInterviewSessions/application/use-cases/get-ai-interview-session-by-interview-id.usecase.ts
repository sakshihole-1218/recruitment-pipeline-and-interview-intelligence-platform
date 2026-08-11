import { Injectable } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { AiInterviewSessionEntity } from '../../entities/ai-interview-session.entity';
import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';

@Injectable()
export class GetAiInterviewSessionByInterviewIdUseCase {
  constructor(
    private readonly repository: AiInterviewSessionRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(
    interviewId: string,
    actor?: AuthJwtPayload,
  ): Promise<AiInterviewSessionEntity[]> {
    await this.interviewerAccessValidationHelper.assertCanAccessInterview(
      actor,
      interviewId,
    );
    return this.repository.findByInterviewId(interviewId);
  }
}
