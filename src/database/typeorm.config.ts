import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProd = configService.get<string>('app.env') === 'production';
  const databaseUrl = process.env.DATABASE_URL;

  const connection = databaseUrl
    ? {
      url: databaseUrl,
      ssl: process.env.PG_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
    }
    : {
      host: configService.get<string>('database.host'),
      port: configService.get<number>('database.port'),
      username: configService.get<string>('database.username'),
      password: configService.get<string>('database.password'),
      database: configService.get<string>('database.database'),
    };

  return {
    type: 'postgres',
    ...connection,
    schema: configService.get<string>('database.schema'),
    autoLoadEntities: true,
    synchronize: false,
    logging: isProd ? ['error', 'warn'] : true,
  };
};
