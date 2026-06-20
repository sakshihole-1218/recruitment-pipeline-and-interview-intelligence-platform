import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as fs from 'fs';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { join } from 'path';

import { AppModule } from './app.module';
import { createWinstonLogger } from './common/logger/winston.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestHandlerInterceptor } from './common/interceptors/request-handler.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: WinstonModule.createLogger({
      instance: createWinstonLogger(),
    }),
  });

  const configService = app.get(ConfigService);

  app.use(
    express.json({
      limit: '10mb',
      verify: (req: express.Request & { rawBody?: string }, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    }),
  );
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  app.enableCors();
  app.use(helmet());

  app.setGlobalPrefix(
    configService.get<string>('APP_GLOBAL_PREFIX') || 'admin',
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(
      configService.get<string>('SWAGGER_TITLE') ||
        'Recruitment Pipeline & Interview Intelligence Platform',
    )
    .setDescription(
      configService.get<string>('SWAGGER_DESCRIPTION') ||
        'Backend API documentation for Recruitment Platform',
    )
    .setVersion(configService.get<string>('SWAGGER_VERSION') || '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));

  SwaggerModule.setup(
    configService.get<string>('SWAGGER_PATH') || 'docs',
    app,
    document,
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new RequestHandlerInterceptor());

  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = Number(configService.get<string>('APP_PORT')) || 3000;
  await app.listen(port);
}

bootstrap();
