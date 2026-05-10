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
  ],
})
export class AppModule {}