import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from '@shared/errors';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DataTransferModule } from './data-transfer.module';

async function bootstrap() {
  const app = await NestFactory.create(DataTransferModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const logger = new Logger('DataTransferService');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.enableCors({ origin: '*' });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Data Transfer API')
    .setDescription('Import/Export service for Excel and CSV data management')
    .setVersion('1.0.0')
    .addTag('import-export', 'Import/Export endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.DATA_TRANSFER_PORT || 3010;
  await app.listen(port);
  logger.log(`Data Transfer Service running on port ${port}`);
}

bootstrap();
