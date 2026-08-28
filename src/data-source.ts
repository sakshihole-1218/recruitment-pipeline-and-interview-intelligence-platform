import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const isCompiled = __filename.endsWith('.js');
const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.APP_ENV === 'production';

const dbConnection = process.env.DATABASE_URL
  ? {
    url: process.env.DATABASE_URL,
    ssl: process.env.PG_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  }
  : {
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT),
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  };

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...dbConnection,
  schema: process.env.PG_SCHEMA || 'public',
  synchronize: false,
  logging: isProd ? ['error', 'warn'] : true,
  entities: [isCompiled ? 'dist/*/.entity.js' : 'src/*/.entity.ts'],
  migrations: [isCompiled ? 'dist/migrations/.js' : 'src/migrations/.ts'],
  migrationsTableName: 'migrations_recruitment_platform',
});

export default AppDataSource;