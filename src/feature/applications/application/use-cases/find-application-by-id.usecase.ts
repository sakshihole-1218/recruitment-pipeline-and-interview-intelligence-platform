import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from '../../../../common/authorization/interviewer-access-validation.helper';
import { AuthJwtPayload } from '../../../auth/helpers/jwt-payload.helper';
import { ApplicationEntity } from '../../entities/application.entity';
import { ApplicationRepository } from '../../repositories/application.repository';

@Injectable()
export class FindApplicationByIdUseCase {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  async execute(id: string, actor?: AuthJwtPayload): Promise<ApplicationEntity> {
    const app = await this.applicationRepository.findById(id);
    if (!app) {
      throw new NotFoundException({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND',
      });
    }
    await this.interviewerAccessValidationHelper.assertCanAccessApplication(
      actor,
      id,
    );

    return app;
  }
}
