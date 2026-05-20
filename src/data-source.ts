import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',

  host: configService.get<string>('PG_HOST'),
  port: Number(configService.get('PG_PORT')),
  username: configService.get<string>('PG_USERNAME'),
  password: configService.get<string>('PG_PASSWORD'),
  database: configService.get<string>('PG_DATABASE'),
  schema: configService.get<string>('PG_SCHEMA') || 'public',

  synchronize: false,
  logging: true,

  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations_recruitment_platform',
});