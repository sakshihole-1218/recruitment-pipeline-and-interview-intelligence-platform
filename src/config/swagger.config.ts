import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (
  app: INestApplication,
  configService: ConfigService,
): void => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('swagger.title') ?? 'API')
    .setDescription(
      configService.get<string>('swagger.description') ?? 'API documentation',
    )
    .setVersion(configService.get<string>('swagger.version') ?? '1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(
    configService.get<string>('swagger.path') ?? 'docs',
    app,
    document,
  );
};
