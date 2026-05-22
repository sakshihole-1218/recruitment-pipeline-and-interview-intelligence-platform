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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: envValidationSchema,
      envFilePath: '.env',
    }),
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
  ],
})
export class AppModule {}