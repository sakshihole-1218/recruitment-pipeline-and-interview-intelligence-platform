import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { AiInterviewSessionEntity } from '../../entities/ai-interview-session.entity';
import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';

@Injectable()
export class GetAiInterviewSessionByIdUseCase {
  constructor(
    private readonly repository: AiInterviewSessionRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(id: string, actor?: AuthJwtPayload): Promise<AiInterviewSessionEntity> {
    const session = await this.repository.findById(id);

    if (!session) {
      throw new NotFoundException({
        message: 'AI interview session not found',
        code: 'AI_SESSION_NOT_FOUND',
      });
    }

    await this.interviewerAccessValidationHelper.assertCanAccessAiSession(
      actor,
      id,
    );

    return session;
  }
}
