import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiInterviewFeedbackModule } from '../aiInterviewFeedback/ai-interview-feedback.module';
import { AiInterviewQuestionsModule } from '../aiInterviewQuestions/ai-interview-questions.module';
import { AiInterviewSessionsModule } from '../aiInterviewSessions/ai-interview-sessions.module';
import { AiInterviewTranscriptsModule } from '../aiInterviewTranscripts/ai-interview-transcripts.module';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { CandidateEntity } from '../candidates/entities/candidate.entity';
import { InterviewEntity } from '../interviews/entities/interview.entity';
import { InterviewRoundEntity } from '../interviews/entities/interview-round.entity';
import { JobOpeningEntity } from '../job-openings/entities/job-opening.entity';
import { AiInterviewSessionEntity } from '../aiInterviewSessions/entities/ai-interview-session.entity';
import { AiInterviewFeedbackEntity } from '../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { CandidateInterviewInvitesService } from './application/services/candidate-interview-invites.service';
import { CompleteCandidateInterviewInviteUseCase } from './application/use-cases/complete-candidate-interview-invite.usecase';
import { CreateCandidateInterviewInviteUseCase } from './application/use-cases/create-candidate-interview-invite.usecase';
import { MarkCandidateInterviewInviteAccessedUseCase } from './application/use-cases/mark-candidate-interview-invite-accessed.usecase';
import { RegenerateCandidateInterviewInviteUseCase } from './application/use-cases/regenerate-candidate-interview-invite.usecase';
import { RevokeCandidateInterviewInviteUseCase } from './application/use-cases/revoke-candidate-interview-invite.usecase';
import { ValidateCandidateInterviewInviteUseCase } from './application/use-cases/validate-candidate-interview-invite.usecase';
import { CandidateInterviewAccessController } from './controllers/candidate-interview-access.controller';
import { CandidateInterviewInvitesController } from './controllers/candidate-interview-invites.controller';
import { CandidateInterviewInviteEntity } from './entities/candidate-interview-invite.entity';
import { CandidateInterviewInviteRepository } from './repositories/candidate-interview-invite.repository';
import { CandidateInterviewInvitesReferenceRepository } from './repositories/candidate-interview-invites-reference.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateInterviewInviteEntity,
      InterviewEntity,
      ApplicationEntity,
      CandidateEntity,
      JobOpeningEntity,
      InterviewRoundEntity,
      AiInterviewSessionEntity,
      AiInterviewFeedbackEntity,
    ]),
    AiInterviewSessionsModule,
    AiInterviewQuestionsModule,
    AiInterviewTranscriptsModule,
    AiInterviewFeedbackModule,
  ],
  controllers: [
    CandidateInterviewInvitesController,
    CandidateInterviewAccessController,
  ],
  providers: [
    CandidateInterviewInviteRepository,
    CandidateInterviewInvitesReferenceRepository,
    CreateCandidateInterviewInviteUseCase,
    ValidateCandidateInterviewInviteUseCase,
    MarkCandidateInterviewInviteAccessedUseCase,
    CompleteCandidateInterviewInviteUseCase,
    RevokeCandidateInterviewInviteUseCase,
    RegenerateCandidateInterviewInviteUseCase,
    CandidateInterviewInvitesService,
  ],
  exports: [CandidateInterviewInvitesService],
})
export class CandidateInterviewInvitesModule {}
