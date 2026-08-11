import { Global, Module } from '@nestjs/common';

import { InterviewerAccessValidationHelper } from './interviewer-access-validation.helper';

@Global()
@Module({
  providers: [InterviewerAccessValidationHelper],
  exports: [InterviewerAccessValidationHelper],
})
export class AuthorizationModule {}
