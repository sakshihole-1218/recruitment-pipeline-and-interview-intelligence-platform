import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InterviewFeedbackController } from './controllers/interview-feedback.controller';
import { InterviewRoundsController } from './controllers/interview-rounds.controller';
import { InterviewsController } from './controllers/interviews.controller';
import { InterviewsService } from './application/services/interviews.service';
import { CreateInterviewRoundUseCase } from './application/use-cases/create-interview-round.usecase';
import { UpdateInterviewRoundUseCase } from './application/use-cases/update-interview-round.usecase';
import { ListInterviewRoundsByJobOpeningUseCase } from './application/use-cases/list-interview-rounds-by-job-opening.usecase';
import { ScheduleInterviewUseCase } from './application/use-cases/schedule-interview.usecase';
import { RescheduleInterviewUseCase } from './application/use-cases/reschedule-interview.usecase';
import { CancelInterviewUseCase } from './application/use-cases/cancel-interview.usecase';
import { CompleteInterviewUseCase } from './application/use-cases/complete-interview.usecase';
import { ReplaceInterviewPanelMembersUseCase } from './application/use-cases/replace-interview-panel-members.usecase';
import { BulkScheduleInterviewsUseCase } from './application/use-cases/bulk-schedule-interviews.use-case';
import { BulkAssignPanelMembersUseCase } from './application/use-cases/bulk-assign-panel-members.use-case';
import { BulkCancelInterviewsUseCase } from './application/use-cases/bulk-cancel-interviews.use-case';
import { FindInterviewByIdUseCase } from './application/use-cases/find-interview-by-id.usecase';
import { ListInterviewsUseCase } from './application/use-cases/list-interviews.usecase';
import { SubmitInterviewFeedbackUseCase } from './application/use-cases/submit-interview-feedback.usecase';
import { ListInterviewFeedbackByInterviewUseCase } from './application/use-cases/list-interview-feedback-by-interview.usecase';
import { ListInterviewFeedbackByApplicationUseCase } from './application/use-cases/list-interview-feedback-by-application.usecase';
import { InterviewFeedbackEntity } from './entities/interview-feedback.entity';
import { InterviewPanelMemberEntity } from './entities/interview-panel-member.entity';
import { InterviewRoundEntity } from './entities/interview-round.entity';
import { InterviewEntity } from './entities/interview.entity';
import { InterviewsPaginationHelper } from './helpers/interviews-pagination.helper';
import { InterviewsValidationHelper } from './helpers/interviews-validation.helper';
import { InterviewFeedbackRepository } from './repositories/interview-feedback.repository';
import { InterviewPanelMemberRepository } from './repositories/interview-panel-member.repository';
import { InterviewRoundRepository } from './repositories/interview-round.repository';
import { InterviewRepository } from './repositories/interview.repository';
import { ActivityLogsModule } from '../activityLogs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InterviewRoundEntity,
      InterviewEntity,
      InterviewPanelMemberEntity,
      InterviewFeedbackEntity,
    ]),
    ActivityLogsModule,
  ],
  controllers: [
    InterviewRoundsController,
    InterviewFeedbackController,
    InterviewsController,
  ],
  providers: [
    InterviewsService,

    InterviewRoundRepository,
    InterviewRepository,
    InterviewPanelMemberRepository,
    InterviewFeedbackRepository,

    InterviewsPaginationHelper,
    InterviewsValidationHelper,

    CreateInterviewRoundUseCase,
    UpdateInterviewRoundUseCase,
    ListInterviewRoundsByJobOpeningUseCase,

    ScheduleInterviewUseCase,
    RescheduleInterviewUseCase,
    CancelInterviewUseCase,
    CompleteInterviewUseCase,
    ReplaceInterviewPanelMembersUseCase,

    BulkScheduleInterviewsUseCase,
    BulkAssignPanelMembersUseCase,
    BulkCancelInterviewsUseCase,

    FindInterviewByIdUseCase,
    ListInterviewsUseCase,

    SubmitInterviewFeedbackUseCase,
    ListInterviewFeedbackByInterviewUseCase,
    ListInterviewFeedbackByApplicationUseCase,
  ],
  exports: [InterviewsService],
})
export class InterviewsModule {}
