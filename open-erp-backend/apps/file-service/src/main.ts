import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from '@shared/errors';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { FileServiceModule } from './file-service.module';

async function bootstrap() {
  const app = await NestFactory.create(FileServiceModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const logger = new Logger('FileService');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.enableCors({
    origin: '*',
  });

  // Apply global exception filter for standardized error handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger/OpenAPI
  const enableSwagger = process.env.ENABLE_SWAGGER === 'true';
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('File Service API')
      .setDescription(
        'File management service with MinIO storage and OnlyOffice integration',
      )
      .setVersion('1.0.0')
      .addTag('files', 'File management endpoints')
      .addTag('presign', 'Presigned URL endpoints')
      .addTag('onlyoffice', 'OnlyOffice integration endpoints')
      .addTag('health', 'Health check endpoints')
      .addBearerAuth()
      .build();

    config['x-service-name'] = 'file-service';

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, document);

    app.getHttpAdapter().get('/api-docs.json', (req, res) => {
      res.json(document);
    });

    logger.log('Swagger documentation enabled at /docs and /api-docs.json');
  }

  const port = process.env.FILE_SERVICE_PORT || 3008;
  await app.listen(port);

  logger.log(`File service is running on port ${port}`);
}

bootstrap();
