import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import appConfig from './config/app.config';
import { envValidationSchema } from './config/env.validation';
import { getTypeOrmConfig } from './database/typeorm.config';
import { HealthModule } from './feature/health/health.module';
import { AccessControlModule } from './feature/accessControl/access-control.module';
import { AuthModule } from './feature/auth/auth.module';
import { DepartmentsModule } from './feature/departments/departments.module';
import { SkillsModule } from './feature/skills/skills.module';
import { JobOpeningsModule } from './feature/job-openings/job-openings.module';
import { CandidatesModule } from './feature/candidates/candidates.module';
import { ApplicationsModule } from './feature/applications/applications.module';
import { InterviewsModule } from './feature/interviews/interviews.module';
import { DecisionsModule } from './feature/decisions/decisions.module';
import { OffersModule } from './feature/offers/offers.module';
import { ActivityLogsModule } from './feature/activityLogs/activity-logs.module';
import { AiInsightsModule } from './feature/aiInsights/ai-insights.module';
import { AiInterviewSessionsModule } from './feature/aiInterviewSessions/ai-interview-sessions.module';
import { AiInterviewQuestionsModule } from './feature/aiInterviewQuestions/ai-interview-questions.module';
import { AiInterviewTranscriptsModule } from './feature/aiInterviewTranscripts/ai-interview-transcripts.module';
import { AiInterviewFeedbackModule } from './feature/aiInterviewFeedback/ai-interview-feedback.module';
import { AiInterviewProctoringEventsModule } from './feature/aiInterviewProctoringEvents/ai-interview-proctoring-events.module';
import { AiInterviewReviewsModule } from './feature/aiInterviewerReviews/ai-interview-reviews.module';
import { LivekitIntegrationModule } from './feature/livekit-integration/livekit-integration.module';
import { DashboardModule } from './feature/dashboard/dashboard.module';
import { CandidateInterviewInvitesModule } from './feature/candidateInterviewInvites/candidate-interview-invites.module';
import { AuthorizationModule } from './common/authorization/authorization.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: envValidationSchema,
      envFilePath: '.env',
    }),
    AuthorizationModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    HealthModule,
    AccessControlModule,
    AuthModule,
    DepartmentsModule,
    SkillsModule,
    JobOpeningsModule,
    CandidatesModule,
    ApplicationsModule,
    InterviewsModule,
    DecisionsModule,
    OffersModule,
    ActivityLogsModule,
    AiInsightsModule,
    AiInterviewSessionsModule,
    AiInterviewQuestionsModule,
    AiInterviewTranscriptsModule,
    AiInterviewFeedbackModule,
    AiInterviewProctoringEventsModule,
    AiInterviewReviewsModule,
    LivekitIntegrationModule,
    DashboardModule,
    CandidateInterviewInvitesModule,
  ],
})
export class AppModule {}
